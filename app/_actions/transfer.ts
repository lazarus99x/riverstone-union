"use server";

import { adminClient } from "@/lib/admin-supabase";

export async function createTransfer(formData: {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description: string;
}) {
  // Validate
  if (!formData.fromAccountId || !formData.toAccountNumber || !formData.amount || formData.amount <= 0) {
    return { success: false, error: "Invalid transfer details" };
  }

  // Get source account
  const { data: fromAccount, error: fromError } = await adminClient
    .from("bank_accounts")
    .select("*")
    .eq("id", formData.fromAccountId)
    .single();

  if (fromError || !fromAccount) {
    return { success: false, error: "Source account not found" };
  }

  if (fromAccount.balance < formData.amount) {
    return { success: false, error: "Insufficient funds" };
  }

  // Get destination account
  const { data: toAccount, error: toError } = await adminClient
    .from("bank_accounts")
    .select("*")
    .eq("account_number", formData.toAccountNumber)
    .single();

  if (toError || !toAccount) {
    return { success: false, error: "Destination account not found" };
  }

  if (fromAccount.id === toAccount.id) {
    return { success: false, error: "Cannot transfer to the same account" };
  }

  const ref = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: transaction, error: txError } = await adminClient
    .from("transactions")
    .insert({
      transaction_ref: ref,
      type: "transfer",
      status: "completed",
      amount: formData.amount,
      from_account_id: fromAccount.id,
      to_account_id: toAccount.id,
      from_balance_before: fromAccount.balance,
      from_balance_after: fromAccount.balance - formData.amount,
      description: formData.description || `Transfer to ${toAccount.account_name}`,
      category: "transfer",
      initiated_by: "user",
    })
    .select()
    .single();

  if (txError) {
    return { success: false, error: `Transaction failed: ${txError.message}` };
  }

  // Update balances
  await adminClient.from("bank_accounts").update({ balance: fromAccount.balance - formData.amount }).eq("id", fromAccount.id);
  await adminClient.from("bank_accounts").update({ balance: toAccount.balance + formData.amount }).eq("id", toAccount.id);

  return { success: true, transaction };
}