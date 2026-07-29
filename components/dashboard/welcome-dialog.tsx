"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Copy,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/* ── Account Details ────────────────────────────────────────── */
interface AccountDetails {
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  email: string;
  balance: number;
}

/* ── Props ──────────────────────────────────────────────────── */
interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountDetails: AccountDetails;
}

/* ── Welcome Dialog ─────────────────────────────────────────── */
export default function WelcomeDialog({
  open,
  onOpenChange,
  accountDetails,
}: WelcomeDialogProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Account number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = () => {
    localStorage.setItem("statebank_welcome_shown", "true");
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleGoToDashboard}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto px-2 sm:px-0"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl">
              {/* Decorative header gradient */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/10 via-accent-gold/5 to-transparent" />

              <div className="relative p-5 sm:p-8">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  className="mx-auto mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30"
                >
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent-gold/20 bg-accent-gold/5 px-3 py-1">
                    <Sparkles className="h-3 w-3 text-accent-gold" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-accent-gold uppercase tracking-wider">
                      Account Created
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-text-primary">
                    Welcome to StateBank
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                    Your premium banking account is ready. Here are your details.
                  </p>
                </motion.div>

                {/* Account Details - compact on mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 sm:mt-6 space-y-2 sm:space-y-3"
                >
                  {/* Account Number */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3 sm:p-3.5">
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted">Account Number</p>
                      <p className="mt-0.5 font-mono text-xs sm:text-sm font-semibold text-text-primary truncate">
                        {accountDetails.accountNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(accountDetails.accountNumber)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Detail rows */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-border bg-bg-surface/50 p-2.5 sm:p-3.5">
                      <p className="text-xs text-text-muted">Account Name</p>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-text-primary truncate">
                        {accountDetails.accountName}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-surface/50 p-2.5 sm:p-3.5">
                      <p className="text-xs text-text-muted">Account Type</p>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-text-primary capitalize truncate">
                        {accountDetails.accountType}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-surface/50 p-2.5 sm:p-3.5">
                      <p className="text-xs text-text-muted">Currency</p>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-text-primary">
                        {accountDetails.currency}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-surface/50 p-2.5 sm:p-3.5">
                      <p className="text-xs text-text-muted">Balance</p>
                      <p className="mt-0.5 text-xs sm:text-sm font-semibold text-success">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: accountDetails.currency,
                        }).format(accountDetails.balance)}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="rounded-xl border border-border bg-bg-surface/50 p-3 sm:p-3.5">
                    <p className="text-xs text-text-muted">Registered Email</p>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-text-primary truncate">
                      {accountDetails.email}
                    </p>
                  </div>
                </motion.div>

                {/* Security note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 sm:mt-4 flex items-start gap-2 rounded-xl border border-accent-gold/20 bg-accent-gold/5 p-2.5 sm:p-3"
                >
                  <Shield className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-accent-gold" />
                  <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                    Your account is protected by POV Security. Never share your
                    account number or POV codes.
                  </p>
                </motion.div>

                {/* Button - always visible */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-4 sm:mt-6 sticky bottom-0 bg-bg-card pt-2"
                >
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                  >
                    Continue to Dashboard
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
