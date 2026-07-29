"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Search,
  ChevronDown,
  CircleArrowOutUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  PiggyBank,
  CreditCard,
  Landmark,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import type { BankAccount, Transaction } from "@/hooks/use-banking";

/* ── Icon / gradient helpers ─────────────────────────────────── */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Checking: Wallet,
  Savings: PiggyBank,
  Credit: CreditCard,
  "Business Checking": Landmark,
};
const gradientMap: Record<string, string> = {
  Checking: "from-blue-500 via-blue-600 to-blue-700",
  Savings: "from-emerald-500 via-emerald-600 to-emerald-700",
  Credit: "from-purple-500 via-purple-600 to-purple-700",
  "Business Checking": "from-amber-500 via-amber-600 to-amber-700",
};

/* ──── Status helpers ────────────────────────────────────────── */
const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; class: string }> = {
  completed: { icon: CheckCircle2, class: "text-success" },
  pending: { icon: Clock, class: "text-amber-400" },
  failed: { icon: XCircle, class: "text-destructive" },
};

/* ── Currency formatter ─────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/* ── Account Detail Page ─────────────────────────────────────── */
export default function AccountDetailPage() {
  const params = useParams();
  const { id } = params;

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      // Fetch account
      const { data: acc } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("id", id)
        .single();
      setAccount(acc);

      // Fetch transactions involving this account
      const { data: txs } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_account_id.eq.${id},to_account_id.eq.${id}`)
        .order("created_at", { ascending: false })
        .limit(50);

      setTransactions(txs || []);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  const filteredTxs =
    statusFilter === "all"
      ? transactions
      : transactions.filter((tx) => tx.status === statusFilter);

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
        <p className="mt-4 text-sm text-text-muted">Loading account details…</p>
      </div>
    );
  }

  /* ── Not found ────────────────────────────────────────────── */
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-muted">Account not found</p>
        <Link
          href="/dashboard/accounts"
          className="mt-4 text-sm font-medium text-primary hover:text-primary/80"
        >
          ← Back to Accounts
        </Link>
      </div>
    );
  }

  const Icon = iconMap[account.account_type] || Wallet;
  const gradient = gradientMap[account.account_type] || "from-blue-500 via-blue-600 to-blue-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Back link */}
      <Link
        href="/dashboard/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Accounts
      </Link>

      {/* Account Header */}
      <Card className="relative overflow-hidden border-border">
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradient}`} />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {account.account_name}
                </h1>
                <p className="mt-0.5 text-sm text-text-secondary">{account.account_type} Account</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="rounded-lg border border-border bg-bg-surface/50 px-2.5 py-1 font-mono text-text-muted">
                    {account.account_number}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1 text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    {account.status === "active" ? "Active" : account.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-text-muted">Current Balance</p>
              <p className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
                {fmt(account.balance)}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Available: {fmt(account.ledger_balance || account.balance)}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
            <Link
              href="/dashboard/transfer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-all hover:bg-primary/90"
            >
              <ArrowUpRight className="h-4 w-4" />
              Send Money
            </Link>
            <Link
              href="/dashboard/deposit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium text-text-secondary transition-all hover:bg-accent hover:text-text-primary"
            >
              <ArrowDownRight className="h-4 w-4" />
              Deposit
            </Link>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium text-text-secondary transition-all hover:bg-accent hover:text-text-primary">
              <Download className="h-4 w-4" />
              Download Statement
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-0">
          <CardTitle className="text-lg font-semibold text-text-primary">
            Transaction History
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-muted">
              <Filter className="h-3.5 w-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-text-secondary outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTxs.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTxs.map((tx, i) => {
                    const isIncoming = tx.to_account_id === account.id;
                    const StatusIcon = statusConfig[tx.status]?.icon || CheckCircle2;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group transition-colors hover:bg-accent/50 cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isIncoming
                                  ? "bg-success/10"
                                  : "bg-destructive/10"
                              )}
                            >
                              {isIncoming ? (
                                <ArrowDownRight className="h-4 w-4 text-success" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {tx.description || tx.type}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary">
                            {new Date(tx.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-text-muted">
                            {new Date(tx.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium">
                            <StatusIcon
                              className={cn(
                                "h-3.5 w-3.5",
                                statusConfig[tx.status]?.class
                              )}
                            />
                            <span className="capitalize text-text-secondary">
                              {tx.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isIncoming ? "text-success" : "text-text-primary"
                            )}
                          >
                            {isIncoming ? "+" : "-"}
                            {fmt(Math.abs(tx.amount))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-mono text-text-muted">
                            {tx.transaction_ref}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-text-muted">No transactions found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}