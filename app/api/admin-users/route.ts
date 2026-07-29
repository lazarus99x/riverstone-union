import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

export async function GET() {
  try {
    // Fetch all profiles with their bank accounts using service role key (bypasses RLS)
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch ALL bank accounts — match by either profile UUID or auth UUID
    const { data: accounts, error: accountsError } = await adminClient
      .from("bank_accounts")
      .select("id, user_id, account_number, account_type, balance, status");

    if (accountsError) {
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }

    // Build account lookup: map of user_id -> account info
    // bank_accounts.user_id could be profile UUID or auth UUID depending on when created
    const accountMap = new Map<string, { count: number; total: number; number: string | null }>();
    for (const acct of accounts || []) {
      const key = acct.user_id;
      const existing = accountMap.get(key) || { count: 0, total: 0, number: null };
      existing.count += 1;
      existing.total += Number(acct.balance);
      // Track the first active account's number
      if (!existing.number && acct.status === "active" && acct.account_number) {
        existing.number = acct.account_number;
      }
      accountMap.set(key, existing);
    }

    // For each profile, try matching by profile UUID first, then auth UUID
    const enriched = profiles.map((p: { id: string; user_id: string }) => {
      const byProfileId = accountMap.get(p.id);
      const byAuthId = accountMap.get(p.user_id);
      const best = byProfileId || byAuthId || { count: 0, total: 0, number: null };
      return {
        ...p,
        accounts_count: best.count,
        total_balance: best.total,
        account_number: best.number,
      };
    });

    return NextResponse.json({ users: enriched });
  } catch (err) {
    console.error("Failed to fetch admin users:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}