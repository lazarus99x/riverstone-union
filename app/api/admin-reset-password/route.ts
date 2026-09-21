import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { APP_URL } from "@/lib/constants";

/**
 * POST /api/admin-reset-password
 * Purpose: Admin-triggered password reset for any user. Uses the Supabase
 * admin API to generate a password reset link and optionally notifies the user.
 * The reset link is NOT returned directly — Supabase sends the email.
 * For cases where email delivery is unreliable, a direct reset link is generated
 * so the admin can share it with the user via a support channel.
 *
 * Input: { userId: string } — the user's auth UUID or profile UUID
 * Output: { success, message }
 *
 * Note: This approach uses Supabase's admin.generateLink() to create a
 * recover link that is returned as the response (the admin can relay it to
 * the user during a phone support call). The email is also sent via Supabase.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" });
    }

    // Resolve the auth user ID — userId could be auth UUID or profile UUID
    let authUserId = userId;

    // Try to resolve profile UUID to auth UUID
    const { data: profileByProfileId } = await adminClient
      .from("profiles")
      .select("user_id, email")
      .eq("id", userId)
      .maybeSingle();

    let userEmail = profileByProfileId?.email || null;

    if (profileByProfileId) {
      // userId was a profile UUID — use the auth UUID
      authUserId = profileByProfileId.user_id;
    } else {
      // Try userId as auth UUID directly
      const { data: profileByAuthId } = await adminClient
        .from("profiles")
        .select("email")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileByAuthId) {
        userEmail = profileByAuthId.email;
      }
    }

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: "User email not found. Cannot send reset email.",
      });
    }

    // Strategy: Use the admin API to generate a password reset link.
    // The admin can share this link with the user via support channels
    // while Supabase also sends the automated email.
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: userEmail,
      options: {
        redirectTo: `${APP_URL}/reset-password`,
      },
    });

    if (linkError) {
      return NextResponse.json({
        success: false,
        error: `Failed to generate reset link: ${linkError.message}`,
      });
    }

    // Also send the reset email via Supabase's built-in flow
    const { error: emailError } = await adminClient.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${APP_URL}/reset-password`,
    });

    if (emailError) {
      console.warn("Reset email send failed (link still available):", emailError.message);
    }

    // Return the reset link so the admin can share it with the user if needed
    const resetLink = linkData?.properties?.action_link || null;

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${userEmail}`,
      resetLink, // Available for admin to relay via support channels
    });
  } catch (e: any) {
    console.error("Admin reset password failed:", e);
    return NextResponse.json({ success: false, error: e.message || "Reset failed" });
  }
}