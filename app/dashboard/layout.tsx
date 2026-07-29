"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/client";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardTopNav from "@/components/dashboard/dashboard-top-nav";
import WelcomeDialog from "@/components/dashboard/welcome-dialog";

/* ── Default account details (for welcome dialog) ──────────── */
const defaultAccountDetails = {
  accountNumber: "SB-XXXX-XXXX-XXXX",
  accountName: "Premium Checking",
  accountType: "checking",
  currency: "USD",
  email: "",
  balance: 0,
};

/* ── Dashboard Layout ──────────────────────────────────────── */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [accountDetails, setAccountDetails] = useState(defaultAccountDetails);
  const [welcomeChecked, setWelcomeChecked] = useState(false);

  /* ── Auth redirect ─────────────────────────────────────────── */
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  /* ── Check welcome dialog ──────────────────────────────────── */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const checkWelcome = async () => {
      try {
        const alreadyShown = localStorage.getItem("statebank_welcome_shown");
        if (alreadyShown === "true") {
          setWelcomeChecked(true);
          return;
        }

        // Fetch user's accounts from Supabase
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user?.id)
          .single();

        if (!profile) { setWelcomeChecked(true); return; }

        const { data: accounts, error } = await supabase
          .from("bank_accounts")
          .select("*")
          .eq("user_id", profile.id)
          .limit(1);

        if (error) {
          console.warn("Failed to fetch accounts:", error.message);
          setWelcomeChecked(true);
          return;
        }

        if (accounts && accounts.length > 0) {
          const acct = accounts[0];
          setAccountDetails({
            accountNumber: acct.account_number || acct.accountNumber || "SB-XXXX-XXXX-XXXX",
            accountName: acct.account_name || acct.accountName || "Premium Account",
            accountType: acct.account_type || acct.accountType || "checking",
            currency: acct.currency || "USD",
            email: user?.primaryEmailAddress?.emailAddress || "",
            balance: acct.balance || 0,
          });
          setShowWelcome(true);
        }

        setWelcomeChecked(true);
      } catch (err) {
        console.warn("Welcome check failed:", err);
        setWelcomeChecked(true);
      }
    };

    checkWelcome();
  }, [isLoaded, isSignedIn, user]);

  /* ── Loading state ─────────────────────────────────────────── */
  if (!isLoaded || !welcomeChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navigation */}
        <DashboardTopNav onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Welcome Dialog */}
      <WelcomeDialog
        open={showWelcome}
        onOpenChange={setShowWelcome}
        accountDetails={accountDetails}
      />
    </div>
  );
}
