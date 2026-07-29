import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

export async function POST(request: Request) {
  try {
    const { userId, amount, description, backdated_at } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid deposit" });
    }

    // userId is profile UUID (u.id from admin page) — bank_accounts.user_id = profiles.id
    const { data: accounts } = await adminClient
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (!accounts?.length) {
      return NextResponse.json({ success: false, error: "No active accounts for this user" });
    }

    const account = accounts[0];
    const ref = `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Create transaction
    const txPayload: any = {
      transaction_ref: ref,
      type: "deposit",
      status: "completed",
      amount,
      to_account_id: account.id,
      to_balance_before: account.balance,
      to_balance_after: account.balance + amount,
      description: description || "Deposit",
      category: "deposit",
      initiated_by: "admin",
    };
    if (backdated_at) {
      txPayload.created_at = backdated_at;
      txPayload.completed_at = backdated_at;
    }
    const { error: txError } = await adminClient.from("transactions").insert(txPayload);

    if (txError) {
      return NextResponse.json({ success: false, error: `Transaction failed: ${txError.message}` });
    }

    // Update balance
    const newBalance = account.balance + amount;
    await adminClient.from("bank_accounts").update({ balance: newBalance, ledger_balance: newBalance }).eq("id", account.id);

    return NextResponse.json({ success: true, newBalance, accountNumber: account.account_number });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" });
  }
}