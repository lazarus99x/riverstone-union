"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Plus,
  Minus,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  CreditCard,
  PiggyBank,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts, useRecentTransactions } from "@/hooks/use-banking";
import { Card, CardContent } from "@/components/ui/card";

/* ── Quick Actions ──────────────────────────────────────────── */
const quickActions = [
  { label: "Transfer", href: "/dashboard/transfer", icon: ArrowUpDown, color: "from-blue-500/20 to-blue-600/10", accent: "text-blue-400" },
  { label: "Deposit", href: "/dashboard/deposit", icon: Plus, color: "from-emerald-500/20 to-emerald-600/10", accent: "text-emerald-400" },
  { label: "Withdraw", href: "/dashboard/withdraw", icon: Minus, color: "from-amber-500/20 to-amber-600/10", accent: "text-amber-400" },
  { label: "Pay Bills", href: "/dashboard/bill-pay", icon: Receipt, color: "from-purple-500/20 to-purple-600/10", accent: "text-purple-400" },
];

/* ── Currency formatter ─────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/* ── Item Variants ──────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
} as const;

/* ── Dashboard Overview Page ─────────────────────────────────── */
export default function DashboardOverview() {
  const [showBalances, setShowBalances] = useState(true);
  const { accounts, loading: acctsLoading, totalBalance, fmt } = useAccounts();
  const { transactions: recentTransactions, loading: txLoading } = useRecentTransactions(6);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            Welcome to StateBank
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your account is ready. Start by making a deposit or setting up your profile.
          </p>
        </div>
        <button
          onClick={() => setShowBalances(!showBalances)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary"
        >
          {showBalances ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </motion.div>

      {/* Total Balance Card */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-accent-gold/5 to-bg-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Wallet className="h-4 w-4" />
              <span>Total Balance (All Accounts)</span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                {showBalances ? fmt(totalBalance) : "••••••"}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                <TrendingUp className="h-3 w-3" />
                +3.2%
              </span>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              Updated just now &middot; All accounts healthy
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-text-muted hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative z-10">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated ${action.accent} ring-1 ring-border-muted`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Account Summary Cards + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account Cards */}
        <motion.div variants={itemVariants} className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Your Accounts
            </h2>
            <Link
              href="/dashboard/accounts"
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              View All
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-border bg-bg-card p-6 text-center">
                <Wallet className="mx-auto mb-3 h-8 w-8 text-text-muted" />
                <p className="text-sm font-medium text-text-primary">No accounts yet</p>
                <p className="mt-1 text-xs text-text-muted">Your accounts will appear here once created.</p>
              </div>
            ) : (
              accounts.map((account) => (
              <Link
                key={account.id}
                href={`/dashboard/accounts/${account.id}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-bg-card p-5 transition-all hover:border-text-muted hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-text-muted">{account.account_number?.slice(-4) || "••••"}</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-text-primary">{account.account_name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{account.account_type}</p>
                  <p className="mt-2 font-display text-xl font-bold text-text-primary">
                    {showBalances ? fmt(account.balance) : "••••••"}
                  </p>
                </div>
              </Link>
            ))
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Recent Transactions
            </h2>
            <button className="text-xs font-medium text-text-muted transition-colors hover:text-text-primary">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <Card className="border-border">
            <div className="divide-y divide-border">
              {txLoading ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">Loading transactions...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">No transactions yet</div>
              ) : (
                recentTransactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      tx.type === "deposit" || (tx.to_account_id && !tx.from_account_id)
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {tx.type === "deposit" || (tx.to_account_id) ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(tx.created_at).toLocaleDateString()} &middot; {tx.transaction_ref?.slice(0, 12)}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 text-sm font-semibold",
                    tx.type === "deposit" ? "text-success" : "text-text-primary"
                  )}>
                    {tx.type === "deposit" ? "+" : ""}{fmt(Math.abs(tx.amount))}
                  </span>
                </motion.div>
              )))}
            </div>
            <div className="border-t border-border p-3">
              <Link
                href="/dashboard/accounts"
                className="block rounded-lg py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-accent"
              >
                View All Transactions
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
