"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  ArrowUpDown,
  Plus,
  Minus,
  Receipt,
  Landmark,
  Users,
  Settings,
  X,
  ChevronLeft,
  Building2 as BankIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/* ── Navigation Items ─────────────────────────────────────── */
const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Accounts", href: "/dashboard/accounts", icon: Building2 },
  { label: "Deposit", href: "/dashboard/deposit", icon: Plus },
  { label: "Transfer", href: "/dashboard/transfer", icon: ArrowUpDown },
  { label: "Bill Pay", href: "/dashboard/bill-pay", icon: Receipt },
  { label: "Loans", href: "/dashboard/loans", icon: Landmark },
  { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/* ── Props ──────────────────────────────────────────────────── */
interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

/* ── Sidebar Component ──────────────────────────────────────── */
export default function DashboardSidebar({
  open,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - always visible on desktop, overlay on mobile */}
      <motion.aside
        initial={false}
        animate={{
          x: 0, // Always at x:0 — desktop shows via lg:relative, mobile shows via overlay
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-bg-base",
          "lg:relative",
          // Show/hide on mobile based on open state
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/20">
              <BankIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-text-primary">
              State<span className="text-primary">Bank</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent hover:text-text-primary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-text-secondary hover:bg-accent hover:text-text-primary"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-text-muted group-hover:text-text-secondary"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* POV Security badge */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-xl border border-accent-gold/20 bg-accent-gold/5 px-3 py-2">
            <ChevronLeft className="h-3.5 w-3.5 text-accent-gold shrink-0" />
            <span className="text-xs text-accent-gold/80 font-medium">
              Protected by POV Security
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
