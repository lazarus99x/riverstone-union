"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Loader2,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts } from "@/hooks/use-banking";
import type { BankAccount } from "@/hooks/use-banking";

/* ── Icon map ────────────────────────────────────────────────── */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Checking: Wallet,
  Savings: PiggyBank,
  Credit: CreditCard,
  "Business Checking": Landmark,
};
const gradientMap: Record<string, string> = {
  Checking: "from-blue-500 to-blue-600",
  Savings: "from-emerald-500 to-emerald-600",
  Credit: "from-purple-500 to-purple-600",
  "Business Checking": "from-amber-500 to-amber-600",
};

/* ── Container variants ─────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/* ── Accounts Page ───────────────────────────────────────────── */
export default function AccountsPage() {
  const [showBalances, setShowBalances] = useState(true);
  const { accounts, loading, totalBalance, fmt } = useAccounts();

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const totalCredit = accounts
    .filter((a) => a.account_type === "Credit")
    .reduce((s, a) => s + a.balance, 0);

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center py-24"
      >
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
        <p className="mt-4 text-sm text-text-muted">Loading your accounts…</p>
      </motion.div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────── */
  if (!accounts.length) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center py-24"
      >
        <Wallet className="h-12 w-12 text-text-muted" />
        <h2 className="mt-4 font-display text-xl font-bold text-text-primary">No accounts yet</h2>
        <p className="mt-1 text-sm text-text-muted">Open your first account to get started.</p>
        <Button className="mt-6 gap-1.5">
          <Plus className="h-4 w-4" />
          Open Account
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            My Accounts
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage all your StateBank accounts in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-text-muted transition-colors hover:bg-accent hover:text-text-primary"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showBalances ? "Hide" : "Show"} Balances
          </button>
          <Button className="h-9 gap-1.5">
            <Plus className="h-4 w-4" />
            Open Account
          </Button>
        </div>
      </motion.div>

      {/* Summary bar */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Balance", value: fmt(totalBalance), change: "" },
            { label: "Active Accounts", value: String(activeAccounts.length), change: "" },
            { label: "This Month Interest", value: fmt(0), change: "" },
            { label: "Available Credit", value: totalCredit > 0 ? fmt(totalCredit) : "—", change: "" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="mt-1 font-display text-xl font-bold text-text-primary">
                  {showBalances || stat.label === "Active Accounts"
                    ? stat.value
                    : "••••••"}
                </p>
                {stat.change && (
                  <p className="mt-0.5 text-xs font-medium text-success">{stat.change}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Accounts grid */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
        {accounts.map((account) => {
          const Icon = iconMap[account.account_type] || Wallet;
          const gradient = gradientMap[account.account_type] || "from-blue-500 to-blue-600";
          return (
            <Link
              key={account.id}
              href={`/dashboard/accounts/${account.id}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-bg-card p-5 transition-all hover:border-text-muted hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Gradient accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

              <div className="flex items-start justify-between mt-1">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
                    <Icon className="h-5.5 w-5.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-text-primary">
                      {account.account_name}
                    </h3>
                    <p className="text-xs text-text-muted">{account.account_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    account.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-amber-500/10 text-amber-400"
                  )}>
                    {account.status === "active" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {account.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-text-muted">Account Number</p>
                  <p className="font-mono text-sm font-semibold text-text-primary">
                    {account.account_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Balance</p>
                  <p className="font-display text-lg font-bold text-text-primary">
                    {showBalances ? fmt(account.balance) : "••••••"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-text-muted">
                  Opened {new Date(account.opened_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </motion.div>
    </motion.div>
  );
}