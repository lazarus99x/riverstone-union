import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { APP_URL } from "@/lib/constants";

/**
 * POST /api/admin-reset-password
 * Purpose: Admin-triggered password reset for any user. Two strategies:
 *   1. Send a Supabase reset email (like the forgot-password flow)
 *   2. Generate a direct recovery link the admin can share via support chat
 *
 * Input:  { userId: string } — the user's profile UUID (u.id from admin table)
 * Output: { success, message, resetLink? }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Resolve the auth user and get their email
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    const userEmail = profile.email;
    const authUserId = profile.user_id;
    const redirectTo = `${APP_URL}/reset-password`;

    console.log(
      `[AdminResetPassword] Resetting password for ${userEmail} (auth: ${authUserId})`
    );

    // Strategy 1: Send the reset email via Supabase
    const { error: emailError } = await adminClient.auth.resetPasswordForEmail(
      userEmail,
      { redirectTo }
    );

    let resetLink: string | null = null;

    // Strategy 2: Generate a direct recovery link (bypass fails if API not available)
    try {
      const { data: linkData, error: linkError } =
        await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: userEmail,
          options: { redirectTo },
        });

      if (!linkError && linkData?.properties?.action_link) {
        resetLink = linkData.properties.action_link;
      } else if (linkError) {
        console.warn(
          "[AdminResetPassword] generateLink failed (non-critical):",
          linkError.message
        );
      }
    } catch (linkErr) {
      console.warn(
        "[AdminResetPassword] generateLink exception (non-critical):",
        linkErr
      );
    }

    // Build response
    const messages: string[] = [];
    const parts: string[] = [];

    if (emailError) {
      console.error("[AdminResetPassword] Email send failed:", emailError.message);
      messages.push(`Email send failed: ${emailError.message}`);
    } else {
      parts.push(`email sent to ${userEmail}`);
    }

    if (resetLink) {
      messages.push("Recovery link generated for manual sharing");
    }

    if (parts.length === 0 && !resetLink) {
      // Everything failed
      return NextResponse.json({
        success: false,
        error: messages.join(". ") || "Password reset failed — check server logs",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset initiated. ${parts.length > 0 ? parts.join(", ") : ""}${resetLink ? " Direct link available." : ""}`,
      resetLink,
      emailSent: !emailError,
    });
  } catch (e: any) {
    console.error("[AdminResetPassword] Exception:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Reset failed" },
      { status: 500 }
    );
  }
}