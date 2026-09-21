"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Settings,
  HelpCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";

/* ── Breadcrumb map ─────────────────────────────────────────── */
const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/accounts": "My Accounts",
  "/dashboard/transfer": "Transfer",
  "/dashboard/deposit": "Deposit",
  "/dashboard/withdraw": "Withdraw",
  "/dashboard/bill-pay": "Bill Pay",
  "/dashboard/loans": "Loans",
  "/dashboard/beneficiaries": "Beneficiaries",
  "/dashboard/settings": "Settings",
};

/* ── Props ──────────────────────────────────────────────────── */
interface DashboardTopNavProps {
  onMenuClick: () => void;
}

/* ── Top Nav Component ──────────────────────────────────────── */
export default function DashboardTopNav({ onMenuClick }: DashboardTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; desc: string; time: string; unread: boolean }[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);

  useEffect(() => {
    if (!showNotifications || notifLoading) return;
    setNotifLoading(true);
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || []);
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [showNotifications]);

  // Fetch avatar_url from profiles table
  useEffect(() => {
    if (!user?.id) {
      setAvatarLoading(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      } catch {
        // silent
      } finally {
        setAvatarLoading(false);
      }
    })();
  }, [user?.id]);

  const currentLabel =
    breadcrumbMap[pathname] || pathname.split("/").pop()?.replace(/-/g, " ") || "Overview";

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SB";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg-base/80 backdrop-blur-xl px-4 sm:px-6">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link
              href="/dashboard"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              Dashboard
            </Link>
            {pathname !== "/dashboard" && (
              <>
                <span className="text-text-muted/40">/</span>
                <span className="font-medium text-text-primary capitalize">
                  {currentLabel}
                </span>
              </>
            )}
          </nav>
          <h1 className="text-lg font-semibold text-text-primary sm:hidden capitalize">
            {currentLabel}
          </h1>
        </div>
      </div>

      {/* Right: search, notifications, avatar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary">
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {notifications.filter(n => n.unread).length || 0}
            </span>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary">Notifications</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet</div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-accent border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "mt-1 h-2 w-2 shrink-0 rounded-full",
                              notif.unread ? "bg-primary" : "bg-transparent"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {notif.title}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {notif.desc}
                            </p>
                            <p className="text-[11px] text-text-muted/60 mt-1">
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-border">
                  <button className="w-full rounded-lg py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-accent">
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-accent"
          >
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-primary/20">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={user?.fullName || "User"} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary text-[11px]">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden text-sm font-medium text-text-primary md:block">
              {user?.firstName || "User"}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted md:block" />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>

                <div className="p-1.5">
                  {[
                    { label: "Profile", icon: User, href: "/dashboard/settings" },
                    { label: "Account Settings", icon: Settings, href: "/dashboard/settings" },
                    { label: "Help & Support", icon: HelpCircle, href: "#" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-accent hover:text-text-primary"
                    >
                      <item.icon className="h-4 w-4 text-text-muted" />
                      {item.label}
                    </Link>
                  ))}

                  <div className="my-1 border-t border-border" />

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      clerk.signOut(() => router.push("/"));
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
