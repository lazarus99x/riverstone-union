"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { signUpAction } from "@/app/_actions/auth";
import { createClient } from "@/utils/supabase/client";

/* ── Account Types ──────────────────────────────────────────── */
const accountTypes = [
  { value: "checking", label: "Personal Checking" },
  { value: "savings", label: "Personal Savings" },
  { value: "business-checking", label: "Business Checking" },
  { value: "business-savings", label: "Business Savings" },
  { value: "student", label: "Student Account" },
  { value: "joint", label: "Joint Account" },
];

/* ── Currencies ─────────────────────────────────────────────── */
const currencies = [
  { value: "USD", label: "USD — US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR — Euro", symbol: "€" },
  { value: "GBP", label: "GBP — British Pound", symbol: "£" },
  { value: "CAD", label: "CAD — Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "AUD — Australian Dollar", symbol: "A$" },
  { value: "JPY", label: "JPY — Japanese Yen", symbol: "¥" },
  { value: "CHF", label: "CHF — Swiss Franc", symbol: "Fr" },
  { value: "NGN", label: "NGN — Nigerian Naira", symbol: "₦" },
];

/* ── US States ──────────────────────────────────────────────── */
const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

/* ── Password Strength ──────────────────────────────────────── */
type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

const strengthConfig: Record<
  StrengthLevel,
  { label: string; color: string; width: string }
> = {
  empty: { label: "", color: "bg-bg-elevated", width: "0%" },
  weak: {
    label: "Weak",
    color: "bg-error",
    width: "25%",
  },
  fair: {
    label: "Fair",
    color: "bg-warning",
    width: "50%",
  },
  good: {
    label: "Good",
    color: "bg-info",
    width: "75%",
  },
  strong: {
    label: "Strong",
    color: "bg-success",
    width: "100%",
  },
};

function evaluatePasswordStrength(password: string): StrengthLevel {
  if (!password) return "empty";

  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return "weak";
  if (score <= 2) return "fair";
  if (score <= 3) return "good";
  return "strong";
}

/* ── Validation Rules ───────────────────────────────────────── */
const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

/* ── Form Data Type ─────────────────────────────────────────── */
interface SignUpFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssnLast4: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  accountType: string;
  currency: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

/* ── Sign Up Page ───────────────────────────────────────────── */
export default function SignUpPage() {
  const [form, setForm] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    ssnLast4: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    accountType: "checking",
    currency: "USD",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = evaluatePasswordStrength(form.password);
  const strengthInfo = strengthConfig[strength];
  const passwordsMatch = form.password === form.confirmPassword;

  const updateField = useCallback(
    <K extends keyof SignUpFormData>(field: K, value: SignUpFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.dateOfBirth ||
      !form.ssnLast4 ||
      !form.street ||
      !form.city ||
      !form.state ||
      !form.zipCode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (form.ssnLast4.length !== 4 || !/^\d{4}$/.test(form.ssnLast4)) {
      toast.error("SSN must be the last 4 digits");
      return;
    }

    if (!form.agreeTerms || !form.agreePrivacy) {
      toast.error("Please agree to the Terms & Privacy Policy");
      return;
    }

    if (!form.password) {
      toast.error("Please enter a password");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (strength === "weak") {
      toast.error("Please choose a stronger password");
      return;
    }

    setIsLoading(true);

    // Step 1: Sign up via Supabase Auth (triggers verification email)
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
        },
      },
    });

    if (authError) {
      setIsLoading(false);
      toast.error(authError.message);
      return;
    }

    // Step 2: Create profile using admin server action (bypasses RLS)
    if (authData?.user?.id) {
      const result = await signUpAction({
        userId: authData.user.id,
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        ssnLast4: form.ssnLast4,
        street: form.street,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        accountType: form.accountType,
        currency: form.currency,
      });

      setIsLoading(false);

      if (!result.success) {
        toast.error(result.error || "Account created but profile setup failed. Contact support.");
        return;
      }
    } else {
      setIsLoading(false);
    }

    toast.success("Account created! Check your email to verify before signing in.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base">
      {/* Background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="floating-shape -top-40 right-1/4 h-[600px] w-[600px] bg-primary opacity-[0.04]" />
        <div className="floating-shape -bottom-40 -left-40 h-[500px] w-[500px] bg-accent-gold opacity-[0.03]" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back to home */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
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
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Open Your Account
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Fill in your details below. It takes less than 3 minutes.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ── Section: Personal Information ──────────── */}
              <div>
                <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
                  Personal Information
                </h2>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Full Legal Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="John A. Doe"
                      autoComplete="name"
                      required
                      className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Email + Phone */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        Email Address <span className="text-error">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        Phone Number <span className="text-error">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        autoComplete="tel"
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* DOB + SSN Last 4 */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        Date of Birth <span className="text-error">*</span>
                      </label>
                      <input
                        id="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          updateField("dateOfBirth", e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ssnLast4"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        SSN (Last 4 Digits) <span className="text-error">*</span>
                      </label>
                      <input
                        id="ssnLast4"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={form.ssnLast4}
                        onChange={(e) =>
                          updateField(
                            "ssnLast4",
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        placeholder="••••"
                        autoComplete="off"
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Divider ───────────────────────────────── */}
              <div className="border-t border-border-default" />

              {/* ── Section: Address ──────────────────────── */}
              <div>
                <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
                  Address
                </h2>
                <div className="space-y-4">
                  {/* Street */}
                  <div>
                    <label
                      htmlFor="street"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Street Address <span className="text-error">*</span>
                    </label>
                    <input
                      id="street"
                      type="text"
                      value={form.street}
                      onChange={(e) => updateField("street", e.target.value)}
                      placeholder="123 Main Street, Apt 4B"
                      autoComplete="street-address"
                      required
                      className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* City, State, Zip */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label
                        htmlFor="city"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        City <span className="text-error">*</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="New York"
                        autoComplete="address-level2"
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="state"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        State <span className="text-error">*</span>
                      </label>
                      <select
                        id="state"
                        value={form.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="" disabled>
                          Select state
                        </option>
                        {states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="zipCode"
                        className="mb-1.5 block text-sm font-medium text-text-secondary"
                      >
                        ZIP Code <span className="text-error">*</span>
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.zipCode}
                        onChange={(e) =>
                          updateField(
                            "zipCode",
                            e.target.value.replace(/[^0-9-]/g, "").slice(0, 10)
                          )
                        }
                        placeholder="10001"
                        autoComplete="postal-code"
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Divider ───────────────────────────────── */}
              <div className="border-t border-border-default" />

              {/* ── Section: Account Preferences ───────────── */}
              <div>
                <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
                  Account Preferences
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Account Type */}
                  <div>
                    <label
                      htmlFor="accountType"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Account Type <span className="text-error">*</span>
                    </label>
                    <select
                      id="accountType"
                      value={form.accountType}
                      onChange={(e) =>
                        updateField("accountType", e.target.value)
                      }
                      className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {accountTypes.map((acc) => (
                        <option key={acc.value} value={acc.value}>
                          {acc.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Currency */}
                  <div>
                    <label
                      htmlFor="currency"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Preferred Currency <span className="text-error">*</span>
                    </label>
                    <select
                      id="currency"
                      value={form.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                      className="w-full rounded-xl border border-border-muted bg-bg-input px-4 py-3 text-sm text-text-primary transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {currencies.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Divider ───────────────────────────────── */}
              <div className="border-t border-border-default" />

              {/* ── Section: Security ──────────────────────── */}
              <div>
                <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
                  Security
                </h2>
                <div className="space-y-4">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Create Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          updateField("password", e.target.value)
                        }
                        placeholder="Create a strong password"
                        autoComplete="new-password"
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

                    {/* Strength Meter */}
                    {form.password && (
                      <div className="mt-3 space-y-2">
                        <div className="strength-meter-bar">
                          <div
                            className={`strength-meter-fill ${strengthInfo.color}`}
                            style={{ width: strengthInfo.width }}
                          />
                        </div>
                        <p
                          className={`text-xs font-medium ${strengthInfo.color.replace("bg-", "text-")}`}
                        >
                          {strengthInfo.label &&
                            `Password strength: ${strengthInfo.label}`}
                        </p>
                      </div>
                    )}

                    {/* Password Rules */}
                    {form.password && (
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {passwordRules.map((rule) => {
                          const passed = rule.test(form.password);
                          return (
                            <div
                              key={rule.id}
                              className={`flex items-center gap-1.5 text-xs ${
                                passed ? "text-success" : "text-text-muted"
                              }`}
                            >
                              {passed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span>{rule.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Confirm Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          updateField("confirmPassword", e.target.value)
                        }
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        required
                        className="w-full rounded-xl border border-border-muted bg-bg-input py-3 pr-11 pl-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-active focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {form.confirmPassword && !passwordsMatch && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-error">
                        <XCircle className="h-3.5 w-3.5" />
                        Passwords do not match
                      </p>
                    )}
                    {form.confirmPassword && passwordsMatch && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Divider ───────────────────────────────── */}
              <div className="border-t border-border-default" />

              {/* ── Section: Agreements ────────────────────── */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) =>
                      updateField("agreeTerms", e.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-muted bg-bg-input text-primary transition-colors focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    I agree to the{" "}
                    <Link
                      href="#"
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary-light"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary-light"
                    >
                      Electronic Disclosure
                    </Link>{" "}
                    <span className="text-error">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.agreePrivacy}
                    onChange={(e) =>
                      updateField("agreePrivacy", e.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-muted bg-bg-input text-primary transition-colors focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    I acknowledge the{" "}
                    <Link
                      href="#"
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary-light"
                    >
                      Privacy Policy
                    </Link>{" "}
                    and consent to the processing of my personal data{" "}
                    <span className="text-error">*</span>
                  </span>
                </label>
              </div>

              {/* ── Submit ──────────────────────────────────── */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  "Open Account →"
                )}
              </button>

              {/* Already have an account? */}
              <p className="text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-primary transition-colors hover:text-primary-light"
                >
                  Sign In
                </Link>
              </p>
            </form>
          </div>

          {/* Security note */}
          <p className="mt-6 text-center text-xs text-text-muted">
            <Lock className="mr-1 inline-block h-3 w-3" />
            Your information is encrypted and protected by 256-bit SSL security.
            StateBank will never share your data without your consent.
          </p>
        </motion.div>
      </div>
    </div>
  );
}