"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  ArrowRight,
  CheckCircle2,
  Building2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  X,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

/* ── US Banks ───────────────────────────────────────────────── */
const US_BANKS = [
  "Chase",
  "Bank of America",
  "Wells Fargo",
  "Citibank",
  "US Bank",
  "PNC Bank",
  "Truist",
  "TD Bank",
  "Capital One",
  "Fifth Third Bank",
  "Regions Bank",
  "Huntington Bank",
  "KeyBank",
  "M&T Bank",
  "BMO Harris",
  "First Republic",
  "Silicon Valley Bank",
  "Morgan Stanley",
  "Goldman Sachs",
  "Charles Schwab",
  "Fidelity",
  "E-Trade",
  "SoFi",
  "Ally Bank",
  "Discover Bank",
  "American Express",
  "Synchrony Bank",
  "Barclays US",
  "Santander US",
  "HSBC US",
  "Citizens Bank",
  "Comerica Bank",
  "Zions Bank",
  "Texas Capital Bank",
  "First Horizon Bank",
  "Webster Bank",
  "Valley National Bank",
  "Synovus Bank",
  "Frost Bank",
  "UMB Bank",
  "First National Bank of Omaha",
  "Eastern Bank",
  "Berkshire Bank",
  "NBT Bank",
  "Pacific Premier Bank",
  "Bank of Hawaii",
  "Amalgamated Bank",
  "Popular Bank",
  "Old National Bank",
  "First Financial Bank",
  "Axos Bank",
  "TIAA Bank",
  "Bank of the West",
  "Union Bank",
  "People's United Bank",
  "BancorpSouth",
  "Associated Bank",
  "Cadence Bank",
  "S&T Bank",
  "United Community Bank",
];

/* ── Animations ─────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.6, ease: "easeInOut" as const } },
} as const;

/* ── Currency formatter ─────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/* ── Dropdown sub-component ─────────────────────────────────── */
function BankDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
            !value && "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn(value ? "text-foreground" : "text-muted-foreground")}>
              {value || "Select your bank"}
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search banks..." />
          <CommandList>
            <CommandEmpty>No banks found.</CommandEmpty>
            <CommandGroup>
              {US_BANKS.map((bank) => (
                <CommandItem
                  key={bank}
                  value={bank}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === bank ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-sm">{bank}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
            {US_BANKS.length} banks loaded
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ── Step Indicator ─────────────────────────────────────────── */
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
              i === current
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : i < current
                ? "bg-primary/20 text-primary"
                : "bg-border text-muted-foreground"
            )}
          >
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-xs font-medium hidden sm:inline",
              i === current ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-1 h-px w-6",
                i < current ? "bg-primary/40" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function TransferPage() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "processing" | "pov" | "done">("form");

  // Form fields
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Processing
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Processing transfer...");

  // POV
  const [povCode, setPovCode] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [povLoading, setPovLoading] = useState(false);

  // Done
  const [completedAmount, setCompletedAmount] = useState(0);
  const [completedRecipient, setCompletedRecipient] = useState("");
  const [completedBank, setCompletedBank] = useState("");

  // Shared loading
  const [formLoading, setFormLoading] = useState(false);

  /* ── Progress simulation ──────────────────────────────────── */
  useEffect(() => {
    if (step !== "processing") return;

    setProgress(0);
    setProcessingMessage("Processing transfer...");

    const totalDuration = 3000; // 3 seconds to 80%
    const interval = 30;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / totalDuration) * 80, 80);
      setProgress(pct);

      if (pct >= 50 && pct < 70) {
        setProcessingMessage("Verifying bank details...");
      } else if (pct >= 70) {
        setProcessingMessage("Finalizing...");
      }

      if (pct >= 80) {
        clearInterval(timer);
        setProcessingMessage("POV verification required");
        setTimeout(() => setStep("pov"), 600);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [step]);

  /* ── Initiate Transfer ────────────────────────────────────── */
  const handleInitiate = async () => {
    // Validate
    if (!bankName) {
      toast.error("Please select a bank");
      return;
    }
    if (!accountName.trim()) {
      toast.error("Please enter the account name");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter the account number");
      return;
    }
    if (!routingNumber.trim()) {
      toast.error("Please enter the routing number");
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setFormLoading(true);

    try {
      // Get the user's profile UUID from auth
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be signed in");
        setFormLoading(false);
        return;
      }

      // Get profile UUID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast.error("Profile not found");
        setFormLoading(false);
        return;
      }

      const res = await fetch("/api/initiate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: profile.id,
          bankName,
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          routingNumber: routingNumber.trim(),
          amount: amountNum,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to initiate transfer");
        setFormLoading(false);
        return;
      }

      setTransactionId(data.transactionId);
      setTransactionRef(data.transactionRef);
      setCompletedAmount(amountNum);
      setCompletedRecipient(accountName.trim());
      setCompletedBank(bankName);
      setStep("processing");
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Verify POV Code ──────────────────────────────────────── */
  const handleVerifyPov = async () => {
    if (!povCode || povCode.length !== 6 || !/^\d{6}$/.test(povCode)) {
      toast.error("Please enter a valid 6-digit POV code");
      return;
    }

    if (!transactionId) {
      toast.error("No transaction to verify");
      return;
    }

    setPovLoading(true);

    try {
      const res = await fetch("/api/transfer-pov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          code: povCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "POV verification failed");
        setPovLoading(false);
        return;
      }

      setStep("done");
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setPovLoading(false);
    }
  };

  /* ── Form step ────────────────────────────────────────────── */
  const renderForm = () => (
    <motion.div
      key="form"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-sm">
            <ArrowUpDown className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              External Transfer
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send money to an account at another bank.
            </p>
          </div>
        </div>
      </motion.div>

      {/* POV Notice */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">POV Security</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              For your security, this transfer will require a Point of Verification (POV)
              code from your admin before it completes. Your funds will be held securely
              until verified.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Transfer Details</CardTitle>
            <CardDescription>
              Enter the recipient&apos;s bank information below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Bank Name */}
            <div className="space-y-1.5">
              <Label>Recipient&apos;s Bank</Label>
              <BankDropdown value={bankName} onChange={setBankName} />
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="Full name on the account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            {/* Account Number + Routing Number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  placeholder="9-digit routing number"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  maxLength={9}
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-lg font-semibold"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                placeholder="What's this transfer for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={cn(
                  "flex w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "placeholder:text-muted-foreground resize-none md:text-sm"
                )}
              />
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 rounded-lg border border-border bg-accent/30 p-3">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                External transfers may take 1-3 business days to arrive. A POV code from
                your admin is required to complete this transfer.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="button"
              onClick={handleInitiate}
              disabled={formLoading}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Initiating...
                </>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5" />
                  Initiate Transfer
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  /* ── Processing step ──────────────────────────────────────── */
  const renderProcessing = () => (
    <motion.div
      key="processing"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="relative mb-8">
        <div className="h-20 w-20 rounded-full border-4 border-border flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">{processingMessage}</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Please wait while we process your transfer
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>

      {progress >= 80 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 max-w-md w-full"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-medium">POV verification required</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  /* ── POV step ──────────────────────────────────────────────── */
  const renderPov = () => (
    <motion.div
      key="pov"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md space-y-6 py-8"
    >
      {/* Ref */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-mono text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Ref: {transactionRef}
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
            <ShieldCheck className="h-7 w-7 text-blue-400" />
          </div>
          <CardTitle className="text-lg">POV Verification Required</CardTitle>
          <CardDescription className="mt-2">
            Contact your admin to obtain a POV code to complete this transfer.
            The code was sent to your registered admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Notice */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <p className="text-xs text-amber-300/80 font-medium">
              Transfer to {completedRecipient} at {completedBank}
            </p>
            <p className="text-lg font-bold text-foreground mt-1">{fmt(completedAmount)}</p>
          </div>

          {/* POV Code Input */}
          <div className="space-y-1.5">
            <Label htmlFor="povCode">Enter POV Code</Label>
            <Input
              id="povCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={povCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 6) setPovCode(val);
              }}
              className="text-center text-2xl font-mono font-bold tracking-[0.3em] h-14"
            />
            <p className="text-xs text-muted-foreground text-center mt-1">
              Enter the 6-digit code provided by your admin
            </p>
          </div>

          {/* Verify Button */}
          <Button
            type="button"
            onClick={handleVerifyPov}
            disabled={povLoading || povCode.length !== 6}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
          >
            {povLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Verify Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  /* ── Done step ─────────────────────────────────────────────── */
  const renderDone = () => (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Checkmark animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="relative mb-6"
      >
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/20 flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <motion.path
              d="M14 28.5L24 38.5L42 18.5"
              stroke="#22c55e"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={checkmarkVariants}
              initial="hidden"
              animate="visible"
            />
          </svg>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-green-500 flex items-center justify-center"
        >
          <CheckCircle2 className="h-4 w-4 text-white" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        Transfer completed successfully!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="w-full max-w-sm space-y-3 mt-4"
      >
        <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-lg font-bold text-foreground">{fmt(completedAmount)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Recipient</span>
            <span className="text-sm font-medium text-foreground">{completedRecipient}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bank</span>
            <span className="text-sm font-medium text-foreground">{completedBank}</span>
          </div>
          {transactionRef && (
            <>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="text-xs font-mono text-muted-foreground">{transactionRef}</span>
              </div>
            </>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full h-11 rounded-xl"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowUpDown className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator
          current={
            step === "form" ? 0 : step === "processing" ? 1 : step === "pov" ? 2 : 3
          }
          steps={["Details", "Processing", "Verify", "Complete"]}
        />
      </div>

      {step === "form" && renderForm()}
      {step === "processing" && renderProcessing()}
      {step === "pov" && renderPov()}
      {step === "done" && renderDone()}
    </div>
  );
}