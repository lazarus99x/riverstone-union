"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/**
 * CreateUserDialog
 * Purpose: Shadcn Dialog + Form for admin to create a new user account directly
 * from the admin dashboard. Provisions auth user, profile, and bank account
 * identically to the self-registration flow.
 * Inputs: none (self-contained form with email, password, fullName, phone, accountType)
 * Outputs: calls /api/admin-create-user and refreshes the parent user list on success
 */
export function CreateUserDialog({ onUserCreated }: { onUserCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    accountType: "checking",
    currency: "USD",
  });

  /**
   * handleCreateUser
   * Purpose: Submits the new user creation form to the admin API. On success,
   * closes the dialog, resets the form, triggers parent user list refresh, and
   * shows a success toast.
   * Inputs: form state (email, password, fullName, phone, accountType, currency)
   * Outputs: toast with result, refreshes user list
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) {
      toast.error("Email, password, and full name are required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`User ${form.fullName} created${data.accountNumber ? ` (#${data.accountNumber})` : ""}`);
        setOpen(false);
        setForm({ email: "", password: "", fullName: "", phone: "", accountType: "checking", currency: "USD" });
        onUserCreated();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (err) {
      toast.error("Network error creating user");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm gap-1.5">
          <UserPlus className="w-4 h-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#0b1120] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Account</DialogTitle>
          <DialogDescription className="text-white/40">
            Create a new user account. The user will receive an active account immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-sm">Full Name *</Label>
            <Input
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="John Doe"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-sm">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="user@example.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-sm">Temporary Password *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Min 8 characters"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-sm">Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-sm">Account Type</Label>
              <Select value={form.accountType} onValueChange={(v) => updateField("accountType", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0b1120] border-white/10 text-white">
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="money_market">Money Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-sm">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0b1120] border-white/10 text-white">
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}