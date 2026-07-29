"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { calculatePOVRequired } from "@/lib/banking";

export async function initiateTransfer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const fromAccountId = formData.get("fromAccountId") as string;
  const toAccountNumber = formData.get("toAccountNumber") as string;
  const toBeneficiaryId = formData.get("toBeneficiaryId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string || "";

  if (!fromAccountId || !amount || amount <= 0) {
    throw new Error("Invalid transfer details");
  }

  // Check if amount is valid number
  if (isNaN(amount)) {
    throw new Error("Invalid amount");
  }

  // Start transaction
  const { data: fromAccount, error: fromError } = await supabase
    .from("bank_accounts")
    .select("*, user_id")
    .eq("id", fromAccountId)
    .single();

  if (fromError) throw new Error(`Failed to load source account: ${fromError.message}`);
  if (fromAccount.user_id !== user.id) throw new Error("Unauthorized: Not your account");

  // Check balance
  if (fromAccount.balance < amount) {
    throw new Error("Insufficient funds");
  }

  // Check daily/monthly limits (simplified)
  // In real implementation, check recent transactions

  // Determine destination
  let toAccountId: string | null = null;
  let isInternal = false;

  if (toAccountNumber) {
    // Look up account by number
    const { data: toAcc, error: toError } = await supabase
      .from("bank_accounts")
      .select("id, user_id")
      .eq("account_number", toAccountNumber)
      .single();

    if (toError || !toAcc) throw new Error("Destination account not found");
    toAccountId = toAcc.id;
    isInternal = true;
  } else if (toBeneficiaryId) {
    // Look up beneficiary
    const { data: beneficiary, error: benError } = await supabase
      .from("beneficiaries")
      .select("*, bank_accounts!inner(id)")
      .eq("id", toBeneficiaryId)
      .eq("bank_accounts.user_id", user.id)
      .single();

    if (benError || !beneficiary) throw new Error("Beneficiary not found");
    toAccountId = beneficiary.bank_accounts.id;
    isInternal = true;
  } else {
    throw new Error("No destination specified");
  }

  // Check if transferring to self
  if (fromAccountId === toAccountId) {
    throw new Error("Cannot transfer to the same account");
  }

  // Get destination account
  const { data: toAccount, error: toAccError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", toAccountId)
    .single();

  if (toAccError) throw new Error(`Failed to load destination account: ${toAccError.message}`);

  // Generate transaction reference
  const transactionRef = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 900000) + 100000}`;

  // Determine if POV is required (80% chance)
  const povRequired = calculatePOVRequired();

  // Create transaction record
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      transaction_ref: transactionRef,
      type: "transfer",
      status: povRequired ? "pending_pov" : "pending",
      amount,
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      from_balance_before: fromAccount.balance,
      from_balance_after: fromAccount.balance - amount,
      to_balance_before: toAccount.balance,
      to_balance_after: toAccount.balance + amount,
      description,
      category: "transfer",
      pov_required: povRequired,
      pov_verified: !povRequired, // If not required, it's already verified
      initiated_by: "user",
      created_at: new Date(),
    })
    .select()
    .single();

  if (txError) throw new Error(`Failed to create transaction: ${txError.message}`);

  // If POV is NOT required, process immediately
  if (!povRequired) {
    // Update account balances atomically (in real app, this would be in a DB transaction)
    await supabase
      .from("bank_accounts")
      .update({ balance: fromAccount.balance - amount, ledger_balance: fromAccount.balance - amount })
      .eq("id", fromAccountId);

    await supabase
      .from("bank_accounts")
      .update({ balance: toAccount.balance + amount, ledger_balance: toAccount.balance + amount })
      .eq("id", toAccountId);

    // Update transaction status
    await supabase
      .from("transactions")
      .update({ status: "completed", completed_at: new Date() })
      .eq("id", transaction.id);

    // Log transaction
    await supabase.from("transaction_log").insert({
      transaction_id: transaction.id,
      action: "created",
      performed_by: user.id,
      ip_address: "127.0.0.1", // In real app, get from request
      old_values: null,
      new_values: { amount, fromAccountId, toAccountId },
    });

    revalidatePath("/dashboard/transfer");
    revalidatePath("/dashboard/accounts");
    return { success: true, transaction, requiresPOV: false };
  }

  // If POV is required, return pending status
  revalidatePath("/dashboard/transfer");
  return { success: true, transaction, requiresPOV: true, message: "Transaction requires POV verification. Contact support." };
}

export async function verifyPOV(transactionId: string, povCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Get transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select("*, bank_accounts!from_account_id(user_id), bank_accounts!to_account_id(user_id)")
    .eq("id", transactionId)
    .single();

  if (txError) throw new Error(`Transaction not found: ${txError.message}`);
  if (!transaction.pov_required) throw new Error("This transaction does not require POV verification");

  // Get POV code record
  const { data: povCodeRecord, error: povError } = await supabase
    .from("pov_codes")
    .select("*")
    .eq("transaction_id", transactionId)
    .single();

  if (povError || !povCodeRecord) throw new Error("POV code not found for this transaction");

  // Check if expired
  if (new Date(povCodeRecord.expires_at) < new Date()) {
    throw new Error("POV code has expired");
  }

  // Check attempts
  if (povCodeRecord.attempts >= povCodeRecord.max_attempts) {
    throw new Error("Maximum POV attempts exceeded");
  }

  // Verify code (bcrypt compare)
  const bcrypt = await import("bcryptjs");
  const isValid = await bcrypt.compare(povCode, povCodeRecord.code_hash);

  if (!isValid) {
    // Increment attempts
    await supabase
      .from("pov_codes")
      .update({ attempts: povCodeRecord.attempts + 1 })
      .eq("id", povCodeRecord.id);

    const remaining = povCodeRecord.max_attempts - (povCodeRecord.attempts + 1);
    throw new Error(`Invalid POV code. ${remaining} attempts remaining`);
  }

  // POV verified! Process transaction
  // Update POV record
  await supabase
    .from("pov_codes")
    .update({ used_at: new Date() })
    .eq("id", povCodeRecord.id);

  // Update transaction
  await supabase
    .from("transactions")
    .update({ status: "completed", pov_verified: true, completed_at: new Date() })
    .eq("id", transactionId);

  // Update account balances
  await supabase
    .from("bank_accounts")
    .update({ 
      balance: transaction.from_balance_after, 
      ledger_balance: transaction.from_balance_after 
    })
    .eq("id", transaction.from_account_id);

  await supabase
    .from("bank_accounts")
    .update({ 
      balance: transaction.to_balance_after, 
      ledger_balance: transaction.to_balance_after 
    })
    .eq("id", transaction.to_account_id);

  // Log transaction
  await supabase.from("transaction_log").insert({
    transaction_id: transaction.id,
    action: "completed",
    performed_by: user.id,
    ip_address: "127.0.0.1",
    old_values: { status: "pending_pov" },
    new_values: { status: "completed", pov_verified: true },
  });

  revalidatePath("/dashboard/transfer");
  revalidatePath("/dashboard/accounts");
  return { success: true, message: "POV verified. Transaction completed." };
}