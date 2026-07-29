import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ notifications: [] });
    }

    // Get user's accounts
    const { data: accounts } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("user_id", profile.id);

    const accountIds = accounts?.map(a => a.id) || [];

    if (accountIds.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Get recent transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_account_id.in.(${accountIds.join(",")}),to_account_id.in.(${accountIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(10);

    const notifications = (transactions || []).map((tx: any) => {
      const isCredit = tx.to_account_id && accountIds.includes(tx.to_account_id);
      const isDebit = tx.from_account_id && accountIds.includes(tx.from_account_id);
      const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(tx.amount));
      const timeAgo = getTimeAgo(new Date(tx.created_at));

      let title = "";
      let desc = "";

      if (tx.type === "deposit") {
        title = "Deposit Received";
        desc = `${amount} deposited to your account`;
      } else if (tx.type === "withdrawal") {
        title = "Withdrawal Processed";
        desc = `${amount} withdrawn from your account`;
      } else if (tx.type === "transfer") {
        if (isCredit) {
          title = "Transfer Received";
          desc = `${amount} received from transfer`;
        } else {
          title = "Transfer Sent";
          desc = `${amount} sent via transfer`;
        }
      } else {
        title = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
        desc = `${amount} · ${tx.description || "Transaction"}`;
      }

      return {
        id: tx.id,
        title,
        desc,
        time: timeAgo,
        unread: tx.status === "pending",
      };
    });

    return NextResponse.json({ notifications });
  } catch (e: any) {
    console.error("Failed to fetch notifications:", e);
    return NextResponse.json({ notifications: [] });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}