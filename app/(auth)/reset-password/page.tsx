"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

/**
 * ResetPasswordPage
 * Purpose: Handles the password reset flow after a user clicks the recovery link
 * from their email. The link contains a recovery token in the URL hash fragment
 * (#access_token=xxx&type=recovery&...).
 *
 * Flow:
 * 1. On mount, reads the hash fragment from window.location
 * 2. Exchanges the access_token for a Supabase session
 * 3. Shows a form for the user to enter and confirm a new password
 * 4. Calls supabase.auth.updateUser({ password }) to set it
 * 5. On success, redirects to sign-in
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);

  /**
   * useEffect — process recovery token from URL hash
   * Purpose: Reads the URL hash fragment for access_token, type=recovery,
   * exchanges it for a session via supabase.auth.setSession(), and transitions
   * the UI to show the new-password form.
   * This runs once on mount because Next.js does not include hash fragments
   * in server-side rendering; they're only available client-side.
   */
  useEffect(() => {
    const hash = window.location.hash;
    console.log("[ResetPassword] URL hash received:", hash ? hash.substring(0, 80) + "..." : "none");
    if (!hash) {
      // No hash — the user may have navigated here directly without a token
      setError("Invalid or expired reset link. Please request a new one.");
      setIsProcessing(false);
      return;
    }

    // Parse access_token, refresh_token from hash fragment
    // Format: #access_token=xxx&refresh_token=yyy&type=recovery&...
    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "recovery" || !accessToken) {
      setError("Invalid reset link. Please request a new password reset.");
      setIsProcessing(false);
      return;
    }

    // Exchange the token for a session
    const supabase = createClient();
    supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError("Session expired or invalid. Please request a new reset link.");
        }
        setIsProcessing(false);
      });
  }, []);

  /**
   * handleSubmit
   * Purpose: Validates and sets the new password via supabase.auth.updateUser().
   * Requires that the session was already established from the recovery token.
   * On success, redirects to sign-in page after a brief delay.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsLoading(false);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      setResetComplete(true);
      toast.success("Password reset successfully!");
      // Redirect to sign-in after 3 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    }
  };

  if (resetComplete) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-base p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <h1 className="font-display text-xl font-bold text-text-primary mb-2">Password Reset Complete</h1>
          <p className="text-sm text-text-secondary">
            Your password has been updated. Redirecting you to sign in...
          </p>
        </motion.div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying reset link...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg-base p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <Building2 className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Invalid Link</h1>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <Link
            href="/forgot-password"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark"
          >
            Request New Reset
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
              Set New Password
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Choose a strong, unique password for your account.
            </p>
          </div>

          <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-border-muted bg-bg-input py-3 pr-11 pl-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-border-muted bg-bg-input py-3 pr-11 pl-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                    Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}