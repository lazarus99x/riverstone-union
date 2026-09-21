"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Building2, ArrowUpDown, Download, Upload, DollarSign, Shield, Headphones, Settings,
  Search, CheckCircle, XCircle, Clock, Ban, Trash2, Key, ChevronDown, ChevronUp,
  TrendingUp, BarChart3, FileText, Wallet, RefreshCw, MessageSquare, Plus, Lock, Eye, EyeOff, Loader2,
  UserPlus, Image
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "login" | "denied" | "admin">("loading");
  const [activeTab, setActiveTab] = useState("overview");
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");

  // Admin login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Re-fetch admin profile when tab switches (avatar may have been updated in settings)
  useEffect(() => {
    if (authState !== "admin") return;
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("user_id", user.id)
        .single();
      if (profile?.avatar_url) setAdminAvatar(profile.avatar_url);
      if (profile?.full_name) setAdminName(profile.full_name);
    };
    fetchProfile();
  }, [activeTab, authState]);

  async function checkAdminAccess() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAuthState("login");
      return;
    }

    // Call API route that uses service role key to bypass RLS
    const res = await fetch("/api/check-admin");
    const data = await res.json();

    if (data.isAdmin) {
      setAuthState("admin");
      // Fetch admin's own profile for avatar display in header
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("user_id", user.id)
          .single();
        if (profile?.avatar_url) setAdminAvatar(profile.avatar_url);
        if (profile?.full_name) setAdminName(profile.full_name);
      }
    } else {
      setAuthState("denied");
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your admin credentials");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return;
    }

    // Re-check admin access after login
    await checkAdminAccess();
    setIsLoading(false);
  }

  // --- Show login form ---
  if (authState === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 ring-1 ring-blue-500/20">
              <Shield className="h-7 w-7 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
            <p className="mt-2 text-sm text-white/40">Authorized personnel only</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@riverstoneunion.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white/60">Password</label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Signing in..." : "Sign In to Admin"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/30">
            <Link href="/" className="underline underline-offset-2 hover:text-white/50">Back to Home</Link>
          </p>
        </motion.div>
      </div>
    );
  }

  // --- Access denied ---
  if (authState === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120] p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
            <Shield className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-white/40">You don&apos;t have admin privileges. Sign in with an admin account.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => { createClient().auth.signOut(); setAuthState("login"); }}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5">
              Sign Out
            </button>
            <Link href="/dashboard"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120]">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying access...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Full control over Riverstone Union operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-lg ring-1 ring-white/10">
            {adminAvatar ? (
              <AvatarImage src={adminAvatar} alt={adminName} className="object-cover rounded-lg" />
            ) : (
              <AvatarFallback className="rounded-lg bg-blue-600/20 text-sm font-semibold text-blue-400">
                {adminName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white/90">{adminName}</p>
            <p className="text-xs text-white/40">Administrator</p>
          </div>
          <button onClick={() => { createClient().auth.signOut().then(() => { setAuthState("login"); }); }}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors shrink-0">
          Sign Out
        </button>
          </div>
        </div>

<div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar Navigation - hidden on mobile, visible on md+ */}
        <div className="hidden md:block w-56 shrink-0">
          <div className="sticky top-4 space-y-1 rounded-xl border border-border bg-card/50 p-2 backdrop-blur">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "users", label: "Users", icon: Users },
              { id: "transactions", label: "Transactions", icon: ArrowUpDown },
              { id: "deposits", label: "Deposits", icon: Download },
              { id: "withdrawals", label: "Withdrawals", icon: Upload },
              { id: "loans", label: "Loans", icon: DollarSign },
              { id: "pov", label: "POV Codes", icon: Shield },
              { id: "support", label: "Support", icon: Headphones },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile horizontal tab strip */}
        <div className="md:hidden overflow-x-auto pb-2 w-full">
          <div className="flex gap-1 bg-card/50 backdrop-blur border border-border p-1 rounded-lg w-max">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "users", label: "Users", icon: Users },
              { id: "transactions", label: "Transactions", icon: ArrowUpDown },
              { id: "deposits", label: "Deposits", icon: Download },
              { id: "withdrawals", label: "Withdrawals", icon: Upload },
              { id: "loans", label: "Loans", icon: DollarSign },
              { id: "pov", label: "POV Codes", icon: Shield },
              { id: "support", label: "Support", icon: Headphones },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4 mt-4">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "transactions" && <TransactionsTab />}
          {activeTab === "deposits" && <DepositsTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "loans" && <LoansTab />}
          {activeTab === "pov" && <POVTab />}
          {activeTab === "support" && <SupportTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

// ---- Types for fetched data ----

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  kyc_status: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface BankAccount {
  id: string;
  user_id: string;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
}

interface Transaction {
  id: string;
  transaction_ref: string;
  type: string;
  status: string;
  amount: number;
  from_account_id: string | null;
  to_account_id: string | null;
  description: string | null;
  pov_required: boolean;
  pov_verified: boolean;
  created_at: string | null;
  completed_at: string | null;
}

interface TransactionWithAccounts extends Transaction {
  from_account?: BankAccount | null;
  to_account?: BankAccount | null;
}

interface Loan {
  id: string;
  user_id: string;
  account_id: string;
  loan_type: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  monthly_payment: number;
  remaining_balance: number;
  status: string;
  created_at: string | null;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  created_at: string | null;
}

interface PovCode {
  id: string;
  transaction_id: string;
  attempts: number;
  max_attempts: number;
  created_at: string | null;
  used_at: string | null;
}

interface PoVItem {
  id: string;
  transaction_ref: string;
  user_name: string;
  amount: number;
  created_at: string;
  attempts: number;
  max_attempts: number;
}

// ---- Overview Tab ----

function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    pendingTxns: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeLoans: 0,
    totalVolume: 0,
    pendingPov: 0,
  });
  const [recentTxns, setRecentTxns] = useState<TransactionWithAccounts[]>([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin-stats");
      const data = await res.json();

      setStats(data.stats);
      setRecentTxns(data.recentTxns || []);
    } catch (err) {
      console.error("Failed to fetch overview stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-500", change: `${stats.totalUsers} registered` },
    { label: "Total Accounts", value: stats.totalAccounts.toLocaleString(), icon: Building2, color: "text-green-500", change: `${stats.totalAccounts} open` },
    { label: "Pending Txns", value: stats.pendingTxns.toString(), icon: Clock, color: "text-yellow-500", change: `${stats.pendingTxns} need action` },
    { label: "Pending Deposits", value: stats.pendingDeposits.toString(), icon: Download, color: "text-cyan-500", change: `${stats.pendingDeposits} waiting` },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals.toString(), icon: Upload, color: "text-orange-500", change: `${stats.pendingWithdrawals} waiting` },
    { label: "Active Loans", value: stats.activeLoans.toString(), icon: DollarSign, color: "text-purple-500", change: `${stats.activeLoans} outstanding` },
    { label: "Total Volume", value: `$${stats.totalVolume.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500", change: "lifetime completed" },
    { label: "POV Pending", value: stats.pendingPov.toString(), icon: Shield, color: "text-red-500", change: `${stats.pendingPov} require codes` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <Card key={i} className="p-4 border-border bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{s.value}</p>
                <p className="text-xs mt-1 text-muted-foreground">{s.change}</p>
              </div>
              <div className={`p-2 rounded-lg bg-muted ${s.color} shrink-0`}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-6 border-border bg-card">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        {recentTxns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {recentTxns.map((tx) => {
              const isCredit = tx.type === "deposit" || tx.type === "refund" || tx.type === "interest";
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isCredit ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {isCredit ? <Download className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.transaction_ref}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isCredit ? "text-green-500" : "text-red-500"}`}>
                      {isCredit ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Users Tab ----

function UsersTab() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [users, setUsers] = useState<(Profile & { accounts_count: number; total_balance: number; account_number: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositUserId, setDepositUserId] = useState<string | null>(null);
  const [withdrawUserId, setWithdrawUserId] = useState<string | null>(null);
  const [depositBackdate, setDepositBackdate] = useState(false);
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [withdrawBackdate, setWithdrawBackdate] = useState(false);
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [resetUserId, setResetUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-users");
      const data = await res.json();

      if (!data.users) {
        setUsers([]);
        return;
      }

      // Data is already enriched with accounts_count and total_balance
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border bg-card">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="bg-background border-border" />
          </div>
          <CreateUserDialog onUserCreated={fetchUsers} />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => (
            <Card key={u.id} className="border-border bg-card overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === u.id ? null : u.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    {u.avatar_url ? (
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={u.avatar_url} alt={u.full_name || "User"} className="object-cover" />
                        <AvatarFallback className="bg-blue-600/20 text-blue-500">
                          <Users className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.kyc_status === "verified" ? "bg-green-500/10 text-green-500" : u.kyc_status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                    {u.kyc_status || "pending"}
                  </span>
                  {expanded === u.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expanded === u.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Phone:</span><p className="text-foreground font-medium">{u.phone || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Account #:</span><p className="text-foreground font-medium font-mono">{u.account_number || <span className="text-yellow-500">Not assigned</span>}</p></div>
                    <div><span className="text-muted-foreground text-xs">Balance:</span><p className="text-foreground font-medium">${u.total_balance.toLocaleString()}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => { setShowDeposit(true); setDepositUserId(u.id); toast.info("Deposit form opened"); }}>
                      <Download className="w-3 h-3 mr-1" /> Deposit
                    </Button>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={() => { setShowWithdraw(true); setWithdrawUserId(u.id); setWithdrawAmount(""); setWithdrawReason(""); }}>
                          <Upload className="w-3 h-3 mr-1" /> Withdraw
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                          const dailyLimit = prompt("Enter daily withdrawal limit:", "10000");
                          if (!dailyLimit) return;
                          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "limits", userId: u.id, data: { dailyLimit: parseInt(dailyLimit) } }) });
                          const d = await res.json();
                          toast.success(d.message || "Limits updated");
                        }}>
                          <Settings className="w-3 h-3 mr-1" /> Limits
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs" onClick={async () => {
                          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ban", userId: u.id }) });
                          const d = await res.json();
                          if (d.success) {
                            toast.success(d.message || "Account frozen");
                            // Toggle to unfrozen state in UI
                          } else toast.error(d.error);
                        }}>
                          <Ban className="w-3 h-3 mr-1" /> Freeze
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={async () => {
                          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unban", userId: u.id }) });
                          const d = await res.json();
                          if (d.success) toast.success(d.message || "Account unfrozen");
                          else toast.error(d.error);
                        }}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Activate
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs" onClick={async () => {
                          if (!confirm("Are you sure you want to close this user's accounts?")) return;
                          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", userId: u.id }) });
                          const d = await res.json();
                          toast.success(d.message || "Accounts closed");
                        }}>
                          <Trash2 className="w-3 h-3 mr-1" /> Close Accounts
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_number", userId: u.id }) });
                          const d = await res.json();
                          if (d.success) {
                            // Update this user's account_number in state immediately
                            setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, account_number: d.accountNumber || usr.account_number, accounts_count: Math.max(usr.accounts_count, 1) } : usr));
                            toast.success(d.message);
                          } else toast.error(d.error);
                        }}>
                          <Key className="w-3 h-3 mr-1" /> Assign #
                        </Button>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          id={`avatar-override-${u.id}`}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("userId", u.id);
                            formData.append("isAdminOverride", "true");
                            const res = await fetch("/api/avatar-upload", { method: "POST", body: formData });
                            const data = await res.json();
                            if (data.success) {
                              toast.success("Avatar updated for " + (u.full_name || "user"));
                              setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, avatar_url: data.avatarUrl } : usr));
                            } else {
                              toast.error(data.error || "Avatar upload failed");
                            }
                            e.target.value = "";
                          }}
                        />
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => document.getElementById(`avatar-override-${u.id}`)?.click()}>
                          <Image className="w-3 h-3 mr-1" /> Avatar
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10" onClick={() => { setResetUserId(u.id); }}>
                          <Key className="w-3 h-3 mr-1" /> Reset Pwd
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={async () => {
                          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_kyc", userId: u.id }) });
                          const d = await res.json();
                          toast.success(d.message || "KYC verified");
                        }}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Verify KYC
                        </Button>
                  </div>

                  {showDeposit && depositUserId === u.id && (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <p className="text-sm font-medium">Deposit Funds</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input placeholder="Amount" type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="bg-background border-border text-sm" />
                        <Input placeholder="Description (e.g. Salary)" value={depositDescription} onChange={e => setDepositDescription(e.target.value)} className="bg-background border-border text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="backdate" className="accent-blue-500" checked={depositBackdate} onChange={e => setDepositBackdate(e.target.checked)} />
                        <label htmlFor="backdate" className="text-xs text-muted-foreground">Back-date transaction</label>
                      </div>
                      {depositBackdate && (
                        <Input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="bg-background border-border text-sm" />
                      )}
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full" onClick={async () => {
  const amount = parseFloat(depositAmount);
  if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
  const res = await fetch("/api/admin-deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: u.id, amount, description: depositDescription || "Deposit", ...(depositBackdate ? { backdated_at: depositDate } : {}) }),
  });
  const data = await res.json();
  if (data.success) {
    toast.success(`$${amount.toFixed(2)} deposited. New balance: $${data.newBalance.toFixed(2)}`);
    // Update this user's balance in state immediately
    setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, total_balance: usr.total_balance + amount, accounts_count: Math.max(usr.accounts_count, 1) } : usr));
    setShowDeposit(false);
    setDepositAmount("");
    setDepositBackdate(false);
    setDepositDate(new Date().toISOString().split('T')[0]);
  } else {
    toast.error(data.error || "Deposit failed");
  }
}}>
  Process Deposit
</Button>
                    </div>
                  )}

                  {showWithdraw && withdrawUserId === u.id && (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <p className="text-sm font-medium text-orange-500">Withdraw Funds</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input placeholder="Amount" type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="bg-background border-border text-sm" />
                        <Input placeholder="Reason (optional)" value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)} className="bg-background border-border text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="withdraw-backdate" className="accent-blue-500" checked={withdrawBackdate} onChange={e => setWithdrawBackdate(e.target.checked)} />
                        <label htmlFor="withdraw-backdate" className="text-xs text-muted-foreground">Back-date transaction</label>
                      </div>
                      {withdrawBackdate && (
                        <Input type="date" value={withdrawDate} onChange={e => setWithdrawDate(e.target.value)} className="bg-background border-border text-sm" />
                      )}
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white w-full" onClick={async () => {
  const amount = parseFloat(withdrawAmount);
  if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
  const res = await fetch("/api/admin-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "withdraw", userId: u.id, data: { amount, description: withdrawReason || "Withdrawal", ...(withdrawBackdate ? { backdated_at: withdrawDate } : {}) } }),
  });
  const data = await res.json();
  if (data.success) {
    setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, total_balance: usr.total_balance - amount } : usr));
    toast.success(data.message);
    setShowWithdraw(false);
    setWithdrawAmount("");
    setWithdrawReason("");
    setWithdrawBackdate(false);
    setWithdrawDate(new Date().toISOString().split('T')[0]);
  } else {
    toast.error(data.error || "Withdrawal failed");
  }
}}>
  Process Withdrawal
</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={resetUserId !== null} onOpenChange={(open) => { if (!open) setResetUserId(null); }}>
        <AlertDialogContent className="bg-[#0b1120] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reset User Password?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40">
              This will send a password reset email to the user. They will need to
              check their email and follow the link to set a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={async () => {
                if (!resetUserId) return;
                const res = await fetch("/api/admin-reset-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: resetUserId }),
                });
                const data = await res.json();
                if (data.success) {
                  toast.success(data.message);
                } else {
                  toast.error(data.error || "Reset failed");
                }
                setResetUserId(null);
              }}
            >
              Send Reset Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Transactions Tab ----

function TransactionsTab() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [txs, setTxs] = useState<TransactionWithAccounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-data?type=transactions&filter=${filter}`);
      const data = await res.json();
      setTxs(data.items || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  const filtered = filter === "all" ? txs : txs.filter(t => t.status === filter);

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "pending", "completed", "failed", "reversed", "cancelled"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No transactions found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => {
            const fromDisplay = tx.from_account?.account_number || "External";
            const toDisplay = tx.to_account?.account_number || "External";
            return (
              <Card key={tx.id} className="border-border bg-card overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-full shrink-0 ${tx.type === "deposit" ? "bg-green-500/10 text-green-500" : tx.type === "withdrawal" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                      {tx.type === "deposit" ? <Download className="w-4 h-4" /> : tx.type === "withdrawal" ? <Upload className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">{tx.type} · ${Number(tx.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{tx.transaction_ref}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.status === "completed" ? "bg-green-500/10 text-green-500" :
                      tx.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    }`}>{tx.status}</span>
                    {expanded === tx.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {expanded === tx.id && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground text-xs">From:</span><p className="text-foreground">{fromDisplay}</p></div>
                      <div><span className="text-muted-foreground text-xs">To:</span><p className="text-foreground">{toDisplay}</p></div>
                      <div><span className="text-muted-foreground text-xs">Date:</span><p className="text-foreground">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "N/A"}</p></div>
                      <div><span className="text-muted-foreground text-xs">POV Required:</span><p className={tx.pov_required ? "text-red-500" : "text-green-500"}>{tx.pov_required ? "Yes" : "No"}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={async () => {
                        const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_txn", data: { transactionId: tx.id } }) });
                        const d = await res.json();
                        if (d.success) { toast.success("Transaction approved"); setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, status: "completed" } : t)); }
                        else toast.error(d.error);
                      }}><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="destructive" className="text-xs" onClick={async () => {
                        const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject_txn", data: { transactionId: tx.id } }) });
                        const d = await res.json();
                        if (d.success) { toast.success("Transaction rejected"); setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, status: "cancelled" } : t)); }
                        else toast.error(d.error);
                      }}><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                        const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reverse_txn", data: { transactionId: tx.id } }) });
                        const d = await res.json();
                        if (d.success) { toast.success("Transaction reversed"); setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, status: "reversed" } : t)); }
                        else toast.error(d.error);
                      }}><RefreshCw className="w-3 h-3 mr-1" /> Reverse</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                        const date = prompt("Enter back-date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                        if (date) fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backdate_txn", data: { transactionId: tx.id, date } }) }).then(r => r.json()).then(d => d.success ? toast.success("Transaction backdated") : toast.error(d.error));
                      }}><Clock className="w-3 h-3 mr-1" /> Back-date</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Deposits Tab ----

function DepositsTab() {
  const [deposits, setDeposits] = useState<TransactionWithAccounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-data?type=deposits");
      const data = await res.json();
      setDeposits(data.items || []);
    } catch (err) {
      console.error("Failed to fetch deposits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deposits.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No pending deposits</div>;
  }

  return (
    <div className="space-y-3">
      {deposits.map(d => (
        <Card key={d.id} className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">{d.description || "Deposit"}</p>
              <p className="text-xs text-muted-foreground">{d.transaction_ref} · {d.to_account?.account_number || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-500">+${Number(d.amount).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={async () => {
              const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_txn", data: { transactionId: d.id } }) });
              const r = await res.json();
              if (r.success) { toast.success("Deposit approved"); setDeposits(prev => prev.filter(x => x.id !== d.id)); }
              else toast.error(r.error);
            }}>
              <CheckCircle className="w-3 h-3 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={async () => {
              const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject_txn", data: { transactionId: d.id } }) });
              const r = await res.json();
              if (r.success) { toast.success("Deposit rejected"); setDeposits(prev => prev.filter(x => x.id !== d.id)); }
              else toast.error(r.error);
            }}>
              <XCircle className="w-3 h-3 mr-1" /> Reject
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
              const date = prompt("Back-date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
              if (date) fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backdate_txn", data: { transactionId: d.id, date } }) }).then(r => r.json()).then(r => r.success ? toast.success("Backdated") : toast.error(r.error));
            }}>
              <Clock className="w-3 h-3 mr-1" /> Back-date
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Withdrawals Tab ----

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<TransactionWithAccounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-data?type=withdrawals");
      const data = await res.json();
      setWithdrawals(data.items || []);
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No pending withdrawals</div>;
  }

  return (
    <div className="space-y-3">
      {withdrawals.map(w => (
        <Card key={w.id} className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">{w.description || "Withdrawal"}</p>
              <p className="text-xs text-muted-foreground">{w.transaction_ref} · {w.from_account?.account_number || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{w.created_at ? new Date(w.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-500">-${Number(w.amount).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={async () => {
              const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_txn", data: { transactionId: w.id } }) });
              const r = await res.json();
              if (r.success) { toast.success("Withdrawal approved"); setWithdrawals(prev => prev.filter(x => x.id !== w.id)); }
              else toast.error(r.error);
            }}><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
            <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={async () => {
              const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject_txn", data: { transactionId: w.id } }) });
              const r = await res.json();
              if (r.success) { toast.success("Withdrawal rejected"); setWithdrawals(prev => prev.filter(x => x.id !== w.id)); }
              else toast.error(r.error);
            }}><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Loans Tab ----

function LoansTab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-data?type=loans");
      const data = await res.json();
      setLoans(data.items || []);
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loans.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No loans found</div>;
  }

  return (
    <div className="space-y-3">
      {loans.map(l => (
        <Card key={l.id} className="border-border bg-card">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground capitalize">{l.loan_type} · ${Number(l.principal).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{l.id.slice(0, 8)} · {(Number(l.interest_rate) * 100).toFixed(2)}% APR</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                l.status === "active" ? "bg-green-500/10 text-green-500" :
                l.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                l.status === "defaulted" ? "bg-red-500/10 text-red-500" :
                "bg-muted text-muted-foreground"
              }`}>{l.status}</span>
              {expanded === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
          {expanded === l.id && (
            <div className="px-4 pb-4 border-t pt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Monthly:</span><p className="text-foreground">${Number(l.monthly_payment).toLocaleString()}/mo</p></div>
                <div><span className="text-muted-foreground text-xs">Remaining:</span><p className="text-foreground">${Number(l.remaining_balance).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Tenure:</span><p className="text-foreground">{l.tenure_months} months</p></div>
                <div><span className="text-muted-foreground text-xs">Rate:</span><p className="text-foreground">{(Number(l.interest_rate) * 100).toFixed(2)}%</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={async () => {
                  const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_loan", data: { loanId: l.id } }) });
                  const r = await res.json();
                  if (r.success) { toast.success("Loan approved"); setLoans(prev => prev.map(x => x.id === l.id ? { ...x, status: "active" } : x)); }
                  else toast.error(r.error);
                }}><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                <Button size="sm" variant="destructive" className="text-xs" onClick={async () => {
                  const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject_loan", data: { loanId: l.id } }) });
                  const r = await res.json();
                  if (r.success) { toast.success("Loan rejected"); setLoans(prev => prev.map(x => x.id === l.id ? { ...x, status: "rejected" } : x)); }
                  else toast.error(r.error);
                }}><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                <Button size="sm" variant="outline" className="text-xs text-red-500" onClick={async () => {
                  const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "default_loan", data: { loanId: l.id } }) });
                  const r = await res.json();
                  if (r.success) { toast.success("Loan marked defaulted"); setLoans(prev => prev.map(x => x.id === l.id ? { ...x, status: "defaulted" } : x)); }
                  else toast.error(r.error);
                }}><Ban className="w-3 h-3 mr-1" /> Mark Defaulted</Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ---- POV Tab ----

function POVTab() {
  const [povItems, setPovItems] = useState<PoVItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPovItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-data?type=pov");
      const data = await res.json();
      setPovItems(data.items || []);
    } catch (err) {
      console.error("Failed to fetch POV items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPovItems();
  }, [fetchPovItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">Transactions flagged for POV verification. Generate codes for support to give to users.</p>
      {povItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No POV-pending transactions</div>
      ) : (
        povItems.map((p, i) => (
          <Card key={p.transaction_ref + "-" + i} className="p-4 border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{p.user_name}</p>
                <p className="text-xs text-muted-foreground">{p.transaction_ref} · ${p.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleString() : "N/A"} · {p.attempts}/{p.max_attempts} attempts</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={async () => {
                  const res = await fetch("/api/admin-pov", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ transactionId: p.id }),
                  });
                  const data = await res.json();
                  if (data.success && data.code) {
                    toast.success(`POV code: ${data.code} (copied to clipboard)`);
                    try {
                      await navigator.clipboard.writeText(data.code);
                    } catch {}
                  } else {
                    toast.error(data.error || "Failed to generate code");
                  }
                }}>
                  <Shield className="w-3 h-3 mr-1" /> Generate Code
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                  const res = await fetch("/api/admin-action", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "bypass_pov", data: { transactionId: p.id } }),
                  });
                  const d = await res.json();
                  if (d.success) {
                    toast.success("POV bypassed");
                    // Remove from list
                    setPovItems(prev => prev.filter(item => item.id !== p.id));
                  } else {
                    toast.error(d.error || "Bypass failed");
                  }
                }}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Bypass
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ---- Support Tab ----

function SupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-data?type=support");
      const data = await res.json();
      setTickets(data.items || []);
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No support tickets</div>;
  }

  return (
    <div className="space-y-3">
      {tickets.map(t => (
        <Card key={t.id} className="p-4 border-border bg-card">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-foreground">{t.subject}</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  t.priority === "urgent" ? "bg-red-500/10 text-red-500" :
                  t.priority === "high" ? "bg-orange-500/10 text-orange-500" :
                  t.priority === "low" ? "bg-green-500/10 text-green-500" :
                  "bg-muted text-muted-foreground"
                }`}>{t.priority}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ticket · {t.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleString() : "N/A"}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                t.status === "open" ? "bg-yellow-500/10 text-yellow-500" :
                t.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                t.status === "resolved" || t.status === "closed" ? "bg-green-500/10 text-green-500" :
                "bg-muted text-muted-foreground"
              }`}>{t.status.replace("_", " ")}</span>
              <Button size="sm" variant="outline" className="text-xs"><MessageSquare className="w-3 h-3 mr-1" /> Respond</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Settings Tab ----

function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});
  // Admin profile state
  const [profileFullName, setProfileFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [emailChangePending, setEmailChangePending] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [isProfileAvatarUploading, setIsProfileAvatarUploading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-data?type=settings");
      const data = await res.json();
      setSettings(data.settings || {});
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * useEffect — fetch admin's profile data
   * Purpose: Loads the current admin's profile (name, email, phone) into
   * the profile form state so the admin can edit their own details.
   */
  useEffect(() => {
    const fetchAdminProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileFullName(profile.full_name || "");
        setProfileEmail(profile.email || user.email || "");
        setProfilePhone(profile.phone || "");
        setProfileAvatarUrl(profile.avatar_url || null);
      } else {
        setProfileEmail(user.email || "");
      }
    };
    fetchAdminProfile();
  }, []);

  /**
   * handleSaveAdminProfile
   * Purpose: Saves the admin's profile changes. Updates name and phone directly
   * via the profiles table. For email changes, uses Supabase's built-in
   * updateUser() which triggers a confirmation email to the new address —
   * the email is only changed after the user clicks the confirmation link.
   * Validates phone format before saving.
   */
  const handleSaveAdminProfile = async () => {
    if (!profileFullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setIsProfileSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsProfileSaving(false);
      toast.error("Not authenticated");
      return;
    }

    // Save name and phone to profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: profileFullName.trim(),
        phone: profilePhone.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (profileError) {
      setIsProfileSaving(false);
      toast.error("Failed to save profile: " + profileError.message);
      return;
    }

    // If email changed, use Supabase's updateUser which sends confirmation
    if (profileEmail !== user.email && profileEmail.trim()) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: profileEmail.trim(),
      });
      if (emailError) {
        toast.error("Email update failed: " + emailError.message);
      } else {
        setEmailChangePending(true);
        toast.success("Confirmation email sent to " + profileEmail.trim());
      }
    } else {
      toast.success("Profile saved successfully!");
    }

    setIsProfileSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* ── Admin Profile ── */}
      <Card className="p-4 sm:p-6 border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">My Profile</h3>
        </div>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl">
              {profileAvatarUrl ? (
                <AvatarImage src={profileAvatarUrl} alt={profileFullName || "Admin"} className="object-cover" />
              ) : (
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/10 text-lg font-bold text-blue-400">
                  {(profileFullName || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                id="admin-avatar-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsProfileAvatarUploading(true);
                  const formData = new FormData();
                  formData.append("file", file);
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  formData.append("userId", user?.id || "");
                  const res = await fetch("/api/avatar-upload", { method: "POST", body: formData });
                  const data = await res.json();
                  if (data.success) {
                    setProfileAvatarUrl(data.avatarUrl);
                    toast.success("Profile picture updated!");
                  } else {
                    toast.error(data.error || "Upload failed");
                  }
                  setIsProfileAvatarUploading(false);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-white/10 text-white/80"
                disabled={isProfileAvatarUploading}
                onClick={() => document.getElementById("admin-avatar-upload")?.click()}
              >
                {isProfileAvatarUploading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</> : profileAvatarUrl ? "Change Photo" : "Upload Photo"}
              </Button>
              {profileAvatarUrl && (
                <Button variant="ghost" size="sm" className="text-xs text-red-400 ml-1" onClick={async () => {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
                  if (error) toast.error(error.message);
                  else { setProfileAvatarUrl(null); toast.success("Avatar removed"); }
                }}>
                  Remove
                </Button>
              )}
              <p className="mt-1 text-[11px] text-white/40">JPEG, PNG, GIF, WebP. Max 2MB.</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white/60 block mb-1">Full Name</label>
            <Input
              value={profileFullName}
              onChange={e => setProfileFullName(e.target.value)}
              className="bg-white/5 border-white/10 text-white max-w-xs"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/60 block mb-1">Email Address</label>
            <div className="flex items-center gap-2">
              <Input
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white max-w-xs"
                placeholder="admin@riverstoneunion.com"
                type="email"
              />
              {emailChangePending && (
                <span className="text-xs text-amber-400">Confirmation email sent — click the link to confirm</span>
              )}
            </div>
            <p className="text-xs text-white/30 mt-1">Changing email requires confirmation via the new address</p>
          </div>
          <div>
            <label className="text-sm font-medium text-white/60 block mb-1">Phone Number</label>
            <Input
              value={profilePhone}
              onChange={e => {
                // Allow digits, spaces, +, -, parentheses only
                const val = e.target.value.replace(/[^\d\s+\-()]/g, "");
                setProfilePhone(val);
              }}
              className="bg-white/5 border-white/10 text-white max-w-xs"
              placeholder="+1 (555) 123-4567"
              type="tel"
            />
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isProfileSaving}
            onClick={handleSaveAdminProfile}
          >
            {isProfileSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 border-border bg-card">
        <h3 className="text-lg font-semibold mb-4">System Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">POV Probability (%)</label>
            <Input data-setting="pov_probability" type="number" defaultValue={settings.pov_probability ?? 80} className="bg-background border-border w-32" />
            <p className="text-xs text-muted-foreground mt-1">Chance a transaction gets flagged for POV verification</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Default Daily Transfer Limit</label>
            <Input data-setting="daily_transfer_limit" type="number" defaultValue={settings.daily_transfer_limit ?? 10000} className="bg-background border-border w-40" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Default Interest Rate (%)</label>
            <Input data-setting="default_interest_rate" type="number" step="0.01" defaultValue={settings.default_interest_rate ?? 4.50} className="bg-background border-border w-32" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Bank Name</label>
            <Input data-setting="bank_name" defaultValue={settings.bank_name ?? "Riverstone Union"} className="bg-background border-border max-w-xs" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Routing Number</label>
            <Input data-setting="routing_number" defaultValue={settings.routing_number ?? "021000021"} className="bg-background border-border w-40" />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={async () => {
  const settings = {
    pov_probability: (document.querySelector('[data-setting="pov_probability"]') as HTMLInputElement)?.value || 80,
    daily_transfer_limit: (document.querySelector('[data-setting="daily_transfer_limit"]') as HTMLInputElement)?.value || 10000,
    default_interest_rate: (document.querySelector('[data-setting="default_interest_rate"]') as HTMLInputElement)?.value || 4.50,
    bank_name: (document.querySelector('[data-setting="bank_name"]') as HTMLInputElement)?.value || "Riverstone Union",
    routing_number: (document.querySelector('[data-setting="routing_number"]') as HTMLInputElement)?.value || "021000021",
  };
  const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_settings", data: { settings } }) });
  const r = await res.json();
  if (r.success) toast.success("Settings saved");
  else toast.error(r.error);
}}>Save Settings</Button>
        </div>
      </Card>

      {/* ── Admin Change Password ── */}
      <Card className="border border-white/10 bg-white/5 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Change Admin Password</h3>
        </div>
        <p className="text-sm text-white/60 mb-4">Update your admin account password.</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const current = (form.elements.namedItem("admin-current") as HTMLInputElement).value;
          const newPw = (form.elements.namedItem("admin-new") as HTMLInputElement).value;
          const confirm = (form.elements.namedItem("admin-confirm") as HTMLInputElement).value;
          if (newPw !== confirm) return toast.error("Passwords do not match");
          if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
          const supabase = createClient();
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: (await supabase.auth.getUser()).data.user?.email ?? "",
            password: current,
          });
          if (signInErr) return toast.error("Current password is incorrect");
          const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
          if (updateErr) return toast.error("Failed: " + updateErr.message);
          toast.success("Password changed successfully!");
          form.reset();
        }}>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Current Password</label>
              <Input name="admin-current" type="password" required className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">New Password</label>
              <Input name="admin-new" type="password" required className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Confirm New</label>
              <Input name="admin-confirm" type="password" required className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">Update Password</Button>
        </form>
      </Card>
    </div>
  );
}