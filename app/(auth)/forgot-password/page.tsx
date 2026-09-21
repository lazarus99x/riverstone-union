"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { APP_URL } from "@/lib/constants";

/**
 * ForgotPasswordPage
 * Purpose: Allows users to request a password reset email. User enters their
 * email address, and Supabase auth sends a reset link. The link redirects to
 * /reset-password with a recovery token in the URL hash fragment.
 * This page replaces the dead "Forgot password?" link on the sign-in page.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  /**
   * handleSubmit
   * Purpose: Sends a password reset email via Supabase auth API.
   * Uses the configured APP_URL as the redirect target so the recovery link
   * lands on our reset-password page where the token is processed.
   * Input: email address from form
   * Output: shows success state or error toast
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-base p-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="floating-shape -top-40 -right-40 h-[500px] w-[500px] bg-primary opacity-[0.06]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Link
            href="/sign-in"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-2xl border border-border-default bg-bg-card p-8 shadow-xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h1 className="font-display text-xl font-bold text-text-primary mb-2">Check Your Email</h1>
              <p className="text-sm text-text-secondary">
                If an account exists for <strong className="text-text-primary">{email}</strong>,
                we've sent a password reset link. It may take a few minutes to arrive.
              </p>
              <p className="mt-4 text-xs text-text-muted">
                Didn't receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-primary underline underline-offset-2 hover:text-primary-light"
                >
                  try again
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-base p-4">
      {/* Background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="floating-shape -top-40 -right-40 h-[500px] w-[500px] bg-primary opacity-[0.06]" />
        <div className="floating-shape -bottom-40 -left-40 h-[400px] w-[400px] bg-accent-gold opacity-[0.04]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/sign-in"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
              Forgot Password?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Enter your email and we'll send you a recovery link.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-border-muted bg-bg-input pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                Remember your password?{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-primary transition-colors hover:text-primary-light"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}