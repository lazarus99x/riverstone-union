"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generateAccountNumber } from "@/lib/account-number";

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const accountType = formData.get("accountType") as string;
  const accountName = formData.get("accountName") as string;
  const currency = formData.get("currency") as string || "USD";

  // Generate unique account number
  const accountNumber = await generateAccountNumber();

  const { data: account, error } = await supabase
    .from("bank_accounts")
    .insert({
      user_id: user.id,
      account_number: accountNumber,
      account_type: accountType,
      account_name: accountName || `${accountType} Account`,
      currency: currency,
      balance: 0,
      ledger_balance: 0,
      status: "active",
      daily_withdrawal_limit: 10000,
      monthly_withdrawal_limit: 50000,
      opened_at: new Date(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create account: ${error.message}`);
  }

  revalidatePath("/dashboard/accounts");
  return account;
}