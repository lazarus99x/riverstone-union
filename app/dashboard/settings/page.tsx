"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Shield,
  Bell,
  Lock,
  Globe,
  Palette,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useClerk } from "@/lib/auth";

/* ── Container variants ─────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/* ── Settings Page ───────────────────────────────────────────── */
export default function SettingsPage() {
  const { user } = useUser();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile form — fetched from Supabase profiles table
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Linked accounts — fetched from profiles table (jsonb field)
  const [linkedAccounts, setLinkedAccounts] = useState<
    { bank: string; number: string; verified: boolean }[]
  >([]);

  // Fetch profile data from Supabase profiles table
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingProfile(false);
      return;
    }

    const fetchProfile = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || user.fullName || "");
        setEmail(data.email || user.primaryEmailAddress?.emailAddress || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");

        if (data.linked_accounts && Array.isArray(data.linked_accounts)) {
          setLinkedAccounts(data.linked_accounts);
        }
      } else {
        // Fallback to auth user metadata
        setFullName(user.fullName || "");
        setEmail(user.primaryEmailAddress?.emailAddress || "");
      }
      setIsLoadingProfile(false);
    };

    fetchProfile();
  }, [user?.id, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  const handleSaveProfile = () => {
    if (!user?.id) {
      toast.error("You must be signed in to update your profile.");
      return;
    }

    const fetchProfile = async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      setIsSaving(false);
      if (error) {
        toast.error("Failed to save profile: " + error.message);
      } else {
        toast.success("Profile updated successfully!");
      }
    };

    fetchProfile();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSaving(false);
    if (error) {
      toast.error("Failed to update password: " + error.message);
    } else {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.fullName
      ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "?";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 shadow-sm">
            <Settings className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
              Settings
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your account preferences and security settings.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 pb-2">
            <TabsList className="inline-flex w-max gap-1 bg-muted/50 p-1">
              <TabsTrigger value="profile" className="gap-1.5 shrink-0">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 shrink-0">
                <Lock className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 shrink-0">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1.5 shrink-0">
                <Globe className="h-4 w-4" />
                <span>Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="devices" className="gap-1.5 shrink-0">
                <Smartphone className="h-4 w-4" />
                <span>Devices</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Profile Tab ───────────────────────────────────── */}
          <TabsContent value="profile">
            {isLoadingProfile ? (
              <Card className="border-border mt-4">
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-border mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-400" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-lg font-bold text-white shadow-lg">
                        {initials}
                      </div>
                      <div>
                        <Button variant="outline" size="sm" className="text-xs">
                          Change Photo
                        </Button>
                        <p className="mt-1 text-[11px] text-text-muted">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="h-10 rounded-xl"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Linked Accounts */}
                <Card className="border-border mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Linked External Accounts</CardTitle>
                    <CardDescription>
                      Accounts connected for ACH transfers and deposits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {linkedAccounts.length > 0 ? (
                      <div className="space-y-3">
                        {linkedAccounts.map((link, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-4.5 w-4.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">{link.bank}</p>
                                <p className="text-xs text-text-muted">{link.number}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {link.verified && (
                                <span className="inline-flex items-center gap-1 text-xs text-success">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Verified
                                </span>
                              )}
                              <button className="text-xs text-text-muted hover:text-destructive transition-colors">
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted py-2">
                        No linked external accounts yet.
                      </p>
                    )}
                    <Button variant="outline" className="mt-3 w-full h-10 rounded-xl text-sm">
                      <Plus className="h-4 w-4" />
                      Link New Account
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── Security Tab ──────────────────────────────────── */}
          <TabsContent value="security">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-400" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password. Use a strong, unique password for your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                      After changing your password, you will be signed out of all active sessions
                      except the current one. You may need to re-enter your password for sensitive
                      transactions.
                    </p>
                  </div>

                  <LoadingButton
                    type="submit"
                    loading={isSaving}
                    loadingText="Updating Password..."
                    variant="outline"
                    className="h-10 rounded-xl"
                  >
                    Update Password
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>

            {/* POV Security */}
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent-gold" />
                  POV Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your Point of Verification (POV) authentication preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "POV Code Delivery", value: "SMS & Email", desc: "Receive POV codes via text message and email" },
                  { label: "Transaction Approval", value: "POV Required", desc: "All transactions require POV code verification" },
                  { label: "Login Alert", value: "Enabled", desc: "Get notified of new sign-ins from unrecognized devices" },
                  { label: "Device Trust", value: "3 Devices", desc: "Trusted devices that don't require POV for sign-in" },
                ].map((setting) => (
                  <div
                    key={setting.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{setting.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{setting.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-success">{setting.value}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications Tab ─────────────────────────────── */}
          <TabsContent value="notifications">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-400" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Transfer Confirmations", email: true, sms: true, push: true },
                  { label: "Deposit Notifications", email: true, sms: false, push: true },
                  { label: "Withdrawal Alerts", email: true, sms: true, push: true },
                  { label: "Bill Payment Reminders", email: true, sms: true, push: false },
                  { label: "Security Alerts", email: true, sms: true, push: true },
                  { label: "Account Statements", email: true, sms: false, push: false },
                  { label: "Promotional Offers", email: false, sms: false, push: false },
                ].map((notif) => (
                  <div
                    key={notif.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5"
                  >
                    <p className="text-sm font-medium text-text-primary">{notif.label}</p>
                    <div className="flex items-center gap-3">
                      {(["email", "sms", "push"] as const).map((channel) => (
                        <label
                          key={channel}
                          className={`flex items-center gap-1.5 text-xs ${
                            notif[channel] ? "text-text-primary" : "text-text-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            defaultChecked={notif[channel]}
                            className="h-3.5 w-3.5 rounded border-border bg-bg-surface text-primary focus:ring-primary/20"
                          />
                          <span className="capitalize">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <Button className="h-10 rounded-xl">Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Preferences Tab ───────────────────────────────── */}
          <TabsContent value="preferences">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-400" />
                  Regional & Display Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Language", value: "English (US)" },
                  { label: "Currency Display", value: "USD ($)" },
                  { label: "Date Format", value: "MM/DD/YYYY" },
                  { label: "Time Format", value: "12-hour" },
                  { label: "Timezone", value: "Eastern Time (UTC-5)" },
                  { label: "Number Format", value: "1,234.56" },
                ].map((pref) => (
                  <div
                    key={pref.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5"
                  >
                    <p className="text-sm font-medium text-text-primary">{pref.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">{pref.value}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Devices Tab ───────────────────────────────────── */}
          <TabsContent value="devices">
            <Card className="border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-cyan-400" />
                  Trusted Devices
                </CardTitle>
                <CardDescription>
                  Devices that have access to your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { device: "iPhone 16 Pro", location: "New York, NY", lastActive: "Just now", current: true },
                  { device: "MacBook Pro - Chrome", location: "New York, NY", lastActive: "2 hours ago", current: false },
                  { device: "Samsung Galaxy S25", location: "Brooklyn, NY", lastActive: "3 days ago", current: false },
                ].map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated">
                        <Smartphone className={`h-4.5 w-4.5 ${d.current ? "text-primary" : "text-text-muted"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {d.device}
                          {d.current && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted">
                          {d.location} &middot; Active {d.lastActive}
                        </p>
                      </div>
                    </div>
                    {!d.current && (
                      <button className="text-xs text-text-muted hover:text-destructive transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}