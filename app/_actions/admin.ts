"use server";

import { adminClient } from "@/lib/admin-supabase";

export async function adminDepositAction(formData: {
  userId: string;
  amount: number;
  description?: string;
}) {
  if (!formData.userId || !formData.amount || formData.amount <= 0) {
    return { success: false, error: "Invalid deposit details" };
  }

  // Get user's active accounts
  const { data: accounts, error: acctError } = await adminClient
    .from("bank_accounts")
    .select("*")
    .eq("user_id", formData.userId)
    .eq("status", "active");

  if (acctError || !accounts?.length) {
    return { success: false, error: "User has no active accounts" };
  }

  const account = accounts[0]; // Deposit to first active account
  const ref = `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Create deposit transaction
  const { data: tx, error: txError } = await adminClient
    .from("transactions")
    .insert({
      transaction_ref: ref,
      type: "deposit",
      status: "completed",
      amount: formData.amount,
      to_account_id: account.id,
      to_balance_before: account.balance,
      to_balance_after: account.balance + formData.amount,
      description: formData.description || "Deposit",
      category: "deposit",
      initiated_by: "admin",
    })
    .select()
    .single();

  if (txError) {
    return { success: false, error: `Transaction failed: ${txError.message}` };
  }

  // Update balance
  const { error: updateError } = await adminClient
    .from("bank_accounts")
    .update({ balance: account.balance + formData.amount, ledger_balance: account.balance + formData.amount })
    .eq("id", account.id);

  if (updateError) {
    return { success: false, error: `Balance update failed: ${updateError.message}` };
  }

  return {
    success: true,
    transaction: tx,
    newBalance: account.balance + formData.amount,
    accountNumber: account.account_number,
  };
}