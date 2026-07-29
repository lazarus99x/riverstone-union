"use server";

import { adminClient } from "@/lib/admin-supabase";
import { generateAccountNumber } from "@/lib/account-number";

export async function signUpAction(formData: {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  ssnLast4: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  accountType: string;
  currency: string;
}) {
  // Create profile using admin client (bypasses RLS)
  const { data: profile, error: profileError } = await adminClient.from("profiles").insert({
    user_id: formData.userId,
    email: formData.email,
    full_name: formData.fullName,
    phone: formData.phone,
    date_of_birth: formData.dateOfBirth,
    ssn_last_four: formData.ssnLast4,
    address: {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
    },
    kyc_status: "pending",
  }).select().single();

  if (profileError) {
    return { success: false, error: `Profile creation failed: ${profileError.message}` };
  }

  // Create bank account with generated account number
  const accountNumber = await generateAccountNumber();
  const { error: accountError } = await adminClient.from("bank_accounts").insert({
    user_id: profile.id,
    account_number: accountNumber,
    account_name: `${formData.fullName} - ${formData.accountType.charAt(0).toUpperCase() + formData.accountType.slice(1)}`,
    account_type: formData.accountType,
    currency: formData.currency || "USD",
    balance: 0,
    ledger_balance: 0,
    status: "active",
    daily_withdrawal_limit: 10000,
    monthly_withdrawal_limit: 50000,
  });

  if (accountError) {
    return { success: true, warning: `Account created but bank account setup pending: ${accountError.message}` };
  }

  return { success: true };
}