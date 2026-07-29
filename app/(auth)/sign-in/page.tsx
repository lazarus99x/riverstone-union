"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return;
    }

    toast.success("Welcome back! Redirecting...");
    window.location.href = "/dashboard";
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-base p-4">
      {/* Background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="floating-shape -top-40 -right-40 h-[500px] w-[500px] bg-primary opacity-[0.06]" />
        <div className="floating-shape -bottom-40 -left-40 h-[400px] w-[400px] bg-accent-gold opacity-[0.04]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back to home */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
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
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to your StateBank account
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-text-secondary"
                  >
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-medium text-primary transition-colors hover:text-primary-light"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-border-muted bg-bg-input py-3 pr-11 pl-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-default" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-card px-2 text-text-muted">
                  Protected by POV Security
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-primary transition-colors hover:text-primary-light"
              >
                Open Account
              </Link>
            </p>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-xs text-text-muted">
            By signing in, you agree to our{" "}
            <Link
              href="#"
              className="underline underline-offset-2 hover:text-text-secondary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="underline underline-offset-2 hover:text-text-secondary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}