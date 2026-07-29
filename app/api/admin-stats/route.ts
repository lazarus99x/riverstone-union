import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

export async function GET() {
  try {
    const [
      { count: totalUsers },
      { count: totalAccounts },
      { count: pendingTxns },
      { count: pendingDepCount },
      { count: pendingWdCount },
      { count: activeLoanCount },
      { count: povPendingCount },
      { data: volData },
      { data: recentTxnsRaw },
    ] = await Promise.all([
      adminClient.from("profiles").select("*", { count: "exact", head: true }),
      adminClient.from("bank_accounts").select("*", { count: "exact", head: true }),
      adminClient.from("transactions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      adminClient.from("transactions").select("*", { count: "exact", head: true }).eq("type", "deposit").eq("status", "pending"),
      adminClient.from("transactions").select("*", { count: "exact", head: true }).eq("type", "withdrawal").eq("status", "pending"),
      adminClient.from("loans").select("*", { count: "exact", head: true }).eq("status", "active"),
      adminClient.from("transactions").select("*", { count: "exact", head: true }).eq("pov_required", true).eq("pov_verified", false).not("status", "eq", "completed"),
      adminClient.from("transactions").select("amount").eq("status", "completed"),
      adminClient.from("transactions")
        .select("id, transaction_ref, type, status, amount, from_account_id, to_account_id, description, pov_required, pov_verified, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const totalVolume = volData?.reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0) || 0;

    // Fetch related accounts for recent transactions
    const recentTxns = recentTxnsRaw || [];
    const accountIds = new Set<string>();
    recentTxns.forEach((t: { from_account_id?: string | null; to_account_id?: string | null }) => {
      if (t.from_account_id) accountIds.add(t.from_account_id);
      if (t.to_account_id) accountIds.add(t.to_account_id);
    });

    let accountMap: Record<string, { id: string; account_number: string; user_id: string }> = {};
    if (accountIds.size > 0) {
      const { data: accounts } = await adminClient
        .from("bank_accounts")
        .select("id, account_number, user_id")
        .in("id", Array.from(accountIds));
      if (accounts) {
        accounts.forEach((a: { id: string; account_number: string; user_id: string }) => {
          accountMap[a.id] = a;
        });
      }
    }

    const enrichedTxns = recentTxns.map((t: { from_account_id?: string | null; to_account_id?: string | null }) => ({
      ...t,
      from_account: t.from_account_id ? accountMap[t.from_account_id] || null : null,
      to_account: t.to_account_id ? accountMap[t.to_account_id] || null : null,
    }));

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalAccounts: totalAccounts || 0,
        pendingTxns: pendingTxns || 0,
        pendingDeposits: pendingDepCount || 0,
        pendingWithdrawals: pendingWdCount || 0,
        activeLoans: activeLoanCount || 0,
        totalVolume,
        pendingPov: povPendingCount || 0,
      },
      recentTxns: enrichedTxns,
    });
  } catch (err) {
    console.error("Failed to fetch admin stats:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}