"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowRight,
  Building2,
  CreditCard,
  Globe,
  Banknote,
  Shield,
  CheckCircle2,
  Copy,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import type { BankAccount } from "@/hooks/use-banking";

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

/* ── Copyable Field ─────────────────────────────────────────── */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5">
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
          {value}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary"
      >
        {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ── Deposit Page ────────────────────────────────────────────── */
export default function DepositPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("bank_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("opened_at", { ascending: false });
        setAccounts(data || []);
      }
      setLoading(false);
    }
    fetchAccounts();
  }, []);

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
        <p className="mt-4 text-sm text-text-muted">Loading account details…</p>
      </div>
    );
  }

  const primaryAccount = accounts[0] || null;

  /* ── Empty state ──────────────────────────────────────────── */
  if (!primaryAccount) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-sm">
              <Plus className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
                Deposit Funds
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Add money to your StateBank accounts.
              </p>
            </div>
          </div>
        </motion.div>
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-12 w-12 text-text-muted" />
          <h2 className="mt-4 font-display text-xl font-bold text-text-primary">No accounts yet</h2>
          <p className="mt-1 text-sm text-text-muted">Open an account before making a deposit.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-sm">
            <Plus className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
              Deposit Funds
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Add money to your StateBank accounts.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Deposit Methods */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="wire" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="wire" className="gap-1.5">
              <Globe className="h-4 w-4" />
              Wire Transfer
            </TabsTrigger>
            <TabsTrigger value="ach" className="gap-1.5">
              <Banknote className="h-4 w-4" />
              ACH Transfer
            </TabsTrigger>
            <TabsTrigger value="check" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              Mobile Check
            </TabsTrigger>
          </TabsList>

          {/* Wire Transfer */}
          <TabsContent value="wire">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  Domestic Wire Transfer
                </CardTitle>
                <CardDescription>
                  Use the details below to send a wire transfer to your StateBank account.
                  Funds are typically available within 2-4 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CopyField label="Bank Name" value="StateBank Financial Services, Inc." />
                <CopyField label="Routing Number (ABA)" value="021000021" />
                <CopyField label="Account Number" value={primaryAccount.account_number} />
                <CopyField label="Account Name" value={primaryAccount.account_name} />
                <CopyField label="SWIFT / BIC" value="STBKUS44" />
                <CopyField label="Bank Address" value="100 Financial District Blvd, New York, NY 10004" />

                <div className="flex items-start gap-2 rounded-lg border border-border bg-bg-surface/50 p-3 mt-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">Important Note</p>
                    <p className="mt-0.5 text-xs text-text-muted leading-relaxed">
                      Wire transfers may incur fees from your sending bank. StateBank does not
                      charge incoming wire fees. For international wires, please include SWIFT code.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3">
                  <Clock className="h-4 w-4 shrink-0 text-success" />
                  <p className="text-xs text-text-secondary">
                    Wire deposits are verified and available within 2-4 hours on business days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACH Transfer */}
          <TabsContent value="ach">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-400" />
                  ACH Transfer Instructions
                </CardTitle>
                <CardDescription>
                  Link your external bank account to StateBank for seamless ACH transfers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Link External Account</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Go to Settings &gt; Linked Accounts and add your external bank details.
                        We&apos;ll make two micro-deposits to verify ownership.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Verify & Confirm</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Check your external account for two small deposits (under $1.00).
                        Enter the amounts in StateBank to verify your account.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Initiate Transfer</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Once verified, you can initiate ACH transfers directly from the Transfer
                        page. Funds settle in 1-3 business days.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full h-11 rounded-xl">
                  <ArrowRight className="h-4 w-4" />
                  Go to Settings to Link Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile Check */}
          <TabsContent value="check">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  Mobile Check Deposit
                </CardTitle>
                <CardDescription>
                  Deposit checks from anywhere using your phone. No trip to the bank required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Endorse the Check</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Sign the back of your check and write &quot;For Mobile Deposit Only at StateBank&quot;
                        below your signature.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Take Photos</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Using the StateBank mobile app, take clear photos of the front and back
                        of the check. Ensure good lighting and all corners are visible.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Submit & Confirm</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Enter the check amount, select the destination account, and submit.
                        Funds are typically available within 1 business day.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Mobile check deposit is currently available only through the StateBank
                    mobile app. Download the app from the App Store or Google Play Store.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}