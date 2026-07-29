import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  if (!type) return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });

  try {
    switch (type) {
      case "transactions": {
        const filter = request.nextUrl.searchParams.get("filter") || "all";
        let query = adminClient
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (filter !== "all") query = query.eq("status", filter);

        const { data: txData, error } = await query;
        if (error) throw error;
        if (!txData) return NextResponse.json({ items: [] });

        // Enrich with account info
        const accountIds = new Set<string>();
        txData.forEach((t: { from_account_id?: string | null; to_account_id?: string | null }) => {
          if (t.from_account_id) accountIds.add(t.from_account_id);
          if (t.to_account_id) accountIds.add(t.to_account_id);
        });

        let accountMap: Record<string, any> = {};
        if (accountIds.size > 0) {
          const { data: accounts } = await adminClient
            .from("bank_accounts")
            .select("*")
            .in("id", Array.from(accountIds));
          if (accounts) accounts.forEach((a: any) => { accountMap[a.id] = a; });
        }

        const enriched = txData.map((t: any) => ({
          ...t,
          from_account: t.from_account_id ? accountMap[t.from_account_id] || null : null,
          to_account: t.to_account_id ? accountMap[t.to_account_id] || null : null,
        }));

        return NextResponse.json({ items: enriched });
      }

      case "deposits": {
        const { data, error } = await adminClient
          .from("transactions")
          .select("*")
          .eq("type", "deposit")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data) return NextResponse.json({ items: [] });

        // Enrich with account info
        const accountIds = new Set<string>();
        data.forEach((t: { from_account_id?: string | null; to_account_id?: string | null }) => {
          if (t.to_account_id) accountIds.add(t.to_account_id);
          if (t.from_account_id) accountIds.add(t.from_account_id);
        });

        let accountMap: Record<string, any> = {};
        if (accountIds.size > 0) {
          const { data: accounts } = await adminClient
            .from("bank_accounts")
            .select("*")
            .in("id", Array.from(accountIds));
          if (accounts) accounts.forEach((a: any) => { accountMap[a.id] = a; });
        }

        const enriched = data.map((t: any) => ({
          ...t,
          from_account: t.from_account_id ? accountMap[t.from_account_id] || null : null,
          to_account: t.to_account_id ? accountMap[t.to_account_id] || null : null,
        }));

        return NextResponse.json({ items: enriched });
      }

      case "withdrawals": {
        const { data, error } = await adminClient
          .from("transactions")
          .select("*")
          .eq("type", "withdrawal")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data) return NextResponse.json({ items: [] });

        const accountIds = new Set<string>();
        data.forEach((t: { from_account_id?: string | null; to_account_id?: string | null }) => {
          if (t.from_account_id) accountIds.add(t.from_account_id);
          if (t.to_account_id) accountIds.add(t.to_account_id);
        });

        let accountMap: Record<string, any> = {};
        if (accountIds.size > 0) {
          const { data: accounts } = await adminClient
            .from("bank_accounts")
            .select("*")
            .in("id", Array.from(accountIds));
          if (accounts) accounts.forEach((a: any) => { accountMap[a.id] = a; });
        }

        const enriched = data.map((t: any) => ({
          ...t,
          from_account: t.from_account_id ? accountMap[t.from_account_id] || null : null,
          to_account: t.to_account_id ? accountMap[t.to_account_id] || null : null,
        }));

        return NextResponse.json({ items: enriched });
      }

      case "loans": {
        const { data, error } = await adminClient
          .from("loans")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ items: data || [] });
      }

      case "pov": {
        // Get transactions needing POV verification
        const { data: txData, error: txError } = await adminClient
          .from("transactions")
          .select("id, transaction_ref, type, amount, from_account_id, to_account_id, created_at")
          .eq("pov_required", true)
          .eq("pov_verified", false)
          .not("status", "eq", "completed")
          .order("created_at", { ascending: false });

        if (txError) throw txError;
        if (!txData || txData.length === 0) return NextResponse.json({ items: [] });

        // Get account IDs
        const accountIds = new Set<string>();
        txData.forEach((t: any) => {
          if (t.from_account_id) accountIds.add(t.from_account_id);
          if (t.to_account_id) accountIds.add(t.to_account_id);
        });

        // Build profile map from accounts
        let profileMap: Record<string, string> = {};
        if (accountIds.size > 0) {
          const { data: accounts } = await adminClient
            .from("bank_accounts")
            .select("id, user_id")
            .in("id", Array.from(accountIds));

          if (accounts) {
            const profileIds = [...new Set(accounts.map((a: any) => a.user_id))];
            const { data: profiles } = await adminClient
              .from("profiles")
              .select("id, full_name")
              .in("id", profileIds);

            if (profiles) {
              profiles.forEach((p: any) => {
                profileMap[p.id] = p.full_name || "Unknown";
              });
            }
          }
        }

        // Get POV code info
        const txIdToPov: Record<string, { attempts: number; max_attempts: number }> = {};
        const { data: povCodes } = await adminClient
          .from("pov_codes")
          .select("transaction_id, attempts, max_attempts")
          .in("transaction_id", txData.map((t: any) => t.id));

        if (povCodes) {
          povCodes.forEach((pc: any) => {
            txIdToPov[pc.transaction_id] = { attempts: pc.attempts, max_attempts: pc.max_attempts };
          });
        }

        // Map account IDs to profile IDs
        const accountUserMap: Record<string, string> = {};
        const { data: accountsForMapping } = await adminClient
          .from("bank_accounts")
          .select("id, user_id")
          .in("id", Array.from(accountIds));

        if (accountsForMapping) {
          accountsForMapping.forEach((a: any) => {
            accountUserMap[a.id] = a.user_id;
          });
        }

        const items = txData.map((t: any) => {
          const goodAccountId = t.from_account_id || t.to_account_id || "";
          const profileId = goodAccountId ? accountUserMap[goodAccountId] || "" : "";
          const povInfo = txIdToPov[t.id] || { attempts: 0, max_attempts: 3 };
          return {
            id: t.id,
            transaction_ref: t.transaction_ref,
            user_name: profileId ? profileMap[profileId] || "Unknown" : "Unknown",
            amount: Number(t.amount),
            created_at: t.created_at || "",
            attempts: povInfo.attempts,
            max_attempts: povInfo.max_attempts,
          };
        });

        return NextResponse.json({ items });
      }

      case "support": {
        const { data, error } = await adminClient
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ items: data || [] });
      }

      case "settings": {
        const { data, error } = await adminClient
          .from("app_settings")
          .select("key, value");

        if (error) throw error;

        const map: Record<string, any> = {};
        if (data) {
          data.forEach((s: { key: string; value: any }) => {
            map[s.key] = s.value;
          });
        }
        return NextResponse.json({ settings: map });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (err: any) {
    console.error(`Failed to fetch admin data (${type}):`, err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}