import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

export async function POST(request: Request) {
  try {
    const { action, userId, data } = await request.json();

    // userId is profile UUID (u.id from admin page)
    // bank_accounts.user_id = profiles.id = profile UUID
    // profiles.user_id = auth UUID (different!)

    switch (action) {
      case "ban":
        await adminClient.from("bank_accounts").update({ status: "frozen" }).eq("user_id", userId).eq("status", "active");
        return NextResponse.json({ success: true, message: "Account frozen" });

      case "unban":
        await adminClient.from("bank_accounts").update({ status: "active" }).eq("user_id", userId).eq("status", "frozen");
        return NextResponse.json({ success: true, message: "Account unfrozen" });

      case "delete":
        await adminClient.from("bank_accounts").update({ status: "closed" }).eq("user_id", userId).eq("status", "active");
        return NextResponse.json({ success: true, message: "Accounts closed" });

      case "verify_kyc": {
        // profiles.user_id is auth UUID — resolve from profile UUID
        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("id", userId)
          .single();
        if (!profile) return NextResponse.json({ success: false, error: "Profile not found" });
        await adminClient.from("profiles").update({ kyc_status: "verified" }).eq("user_id", profile.user_id);
        return NextResponse.json({ success: true, message: "KYC verified" });
      }

      case "assign_number": {
        const { generateAccountNumber } = await import("@/lib/account-number");
        const num = await generateAccountNumber();
        const { data: accts, error: findErr } = await adminClient
          .from("bank_accounts")
          .select("id")
          .eq("user_id", userId);
        if (findErr) return NextResponse.json({ success: false, error: findErr.message });
        if (accts?.length) {
          const acct = accts[0];
          await adminClient.from("bank_accounts").update({ account_number: num }).eq("id", acct.id);
          return NextResponse.json({ success: true, message: `Assigned ${num}`, accountNumber: num });
        }
        // No accounts exist — create one
        const { error: createErr } = await adminClient.from("bank_accounts").insert({
          user_id: userId,
          account_number: num,
          account_name: "Admin-created account",
          account_type: "checking",
          currency: "USD",
          balance: 0,
          ledger_balance: 0,
          status: "active",
          daily_withdrawal_limit: 10000,
          monthly_withdrawal_limit: 50000,
        });
        if (createErr) return NextResponse.json({ success: false, error: `Account creation failed: ${createErr.message}` });
        return NextResponse.json({ success: true, message: `Account created with #${num}`, accountNumber: num });
      }

      case "limits":
        await adminClient.from("bank_accounts")
          .update({ daily_withdrawal_limit: data?.dailyLimit || 10000, monthly_withdrawal_limit: data?.monthlyLimit || 50000 })
          .eq("user_id", userId);
        return NextResponse.json({ success: true, message: "Limits updated" });

      case "withdraw": {
        const amount = data?.amount || 0;
        if (amount <= 0) {
          return NextResponse.json({ success: false, error: "Invalid withdrawal amount" });
        }
        const { data: accts, error: findErr } = await adminClient
          .from("bank_accounts")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active");
        if (findErr || !accts?.length) {
          return NextResponse.json({ success: false, error: "No active accounts" });
        }
        const account = accts[0];
        const newBalance = Number(account.balance) - amount;
        if (newBalance < 0) {
          return NextResponse.json({ success: false, error: "Insufficient balance" });
        }
        const ref = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const txPayload: any = {
          transaction_ref: ref,
          type: "withdrawal",
          status: "completed",
          amount,
          from_account_id: account.id,
          from_balance_before: account.balance,
          from_balance_after: newBalance,
          description: data?.description || "Withdrawal",
          initiated_by: "admin",
        };
        if (data?.backdated_at) {
          txPayload.created_at = data.backdated_at;
          txPayload.completed_at = data.backdated_at;
        }
        await adminClient.from("transactions").insert(txPayload);
        await adminClient.from("bank_accounts").update({ balance: newBalance, ledger_balance: newBalance }).eq("id", account.id);
        return NextResponse.json({ success: true, message: `$${amount.toFixed(2)} withdrawn. New balance: $${newBalance.toFixed(2)}` });
      }

      case "bypass_pov": {
        if (!data?.transactionId) {
          return NextResponse.json({ success: false, error: "Missing transactionId" });
        }
        await adminClient
          .from("transactions")
          .update({ pov_verified: true })
          .eq("id", data.transactionId);
        return NextResponse.json({ success: true, message: "POV verification bypassed" });
      }

      case "approve_txn": {
        if (!data?.transactionId) return NextResponse.json({ success: false, error: "Missing transactionId" });
        await adminClient.from("transactions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", data.transactionId);
        return NextResponse.json({ success: true, message: "Transaction approved" });
      }

      case "reject_txn": {
        if (!data?.transactionId) return NextResponse.json({ success: false, error: "Missing transactionId" });
        await adminClient.from("transactions").update({ status: "cancelled" }).eq("id", data.transactionId);
        return NextResponse.json({ success: true, message: "Transaction rejected" });
      }

      case "reverse_txn": {
        if (!data?.transactionId) return NextResponse.json({ success: false, error: "Missing transactionId" });
        const { data: txn } = await adminClient.from("transactions").select("*").eq("id", data.transactionId).single();
        if (!txn) return NextResponse.json({ success: false, error: "Transaction not found" });
        // Reverse: refund the amount to the source account
        for (const acctId of [txn.from_account_id, txn.to_account_id].filter(Boolean)) {
          const amount = acctId === txn.from_account_id ? txn.amount : -txn.amount;
          const { data: acct } = await adminClient.from("bank_accounts").select("balance").eq("id", acctId).single();
          if (acct) {
            await adminClient.from("bank_accounts").update({ balance: Number(acct.balance) + amount }).eq("id", acctId);
          }
        }
        await adminClient.from("transactions").update({ status: "reversed" }).eq("id", data.transactionId);
        return NextResponse.json({ success: true, message: "Transaction reversed" });
      }

      case "approve_loan": {
        if (!data?.loanId) return NextResponse.json({ success: false, error: "Missing loanId" });
        await adminClient.from("loans").update({ status: "active" }).eq("id", data.loanId);
        // Add loan amount to user's account
        const { data: loan } = await adminClient.from("loans").select("*").eq("id", data.loanId).single();
        if (loan) {
          await adminClient.from("bank_accounts").update({ balance: Number(loan.principal) }).eq("id", loan.account_id);
        }
        return NextResponse.json({ success: true, message: "Loan approved" });
      }

      case "reject_loan": {
        if (!data?.loanId) return NextResponse.json({ success: false, error: "Missing loanId" });
        await adminClient.from("loans").update({ status: "rejected" }).eq("id", data.loanId);
        return NextResponse.json({ success: true, message: "Loan rejected" });
      }

      case "default_loan": {
        if (!data?.loanId) return NextResponse.json({ success: false, error: "Missing loanId" });
        await adminClient.from("loans").update({ status: "defaulted" }).eq("id", data.loanId);
        return NextResponse.json({ success: true, message: "Loan marked as defaulted" });
      }

      case "backdate_txn": {
        if (!data?.transactionId || !data?.date) return NextResponse.json({ success: false, error: "Missing transactionId or date" });
        await adminClient.from("transactions").update({ created_at: new Date(data.date).toISOString(), completed_at: new Date(data.date).toISOString() }).eq("id", data.transactionId);
        return NextResponse.json({ success: true, message: "Transaction backdated" });
      }

      case "save_settings": {
        if (!data?.settings) return NextResponse.json({ success: false, error: "Missing settings" });
        // Upsert each setting key individually into app_settings table
        const entries = Object.entries(data.settings);
        for (const [key, value] of entries) {
          const { data: existing } = await adminClient.from("app_settings").select("id").eq("key", key).maybeSingle();
          if (existing) {
            await adminClient.from("app_settings").update({ value }).eq("id", existing.id);
          } else {
            await adminClient.from("app_settings").insert({ key, value });
          }
        }
        return NextResponse.json({ success: true, message: "Settings saved" });
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Action failed" });
  }
}