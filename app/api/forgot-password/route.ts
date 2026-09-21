import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { APP_URL } from "@/lib/constants";

/**
 * POST /api/forgot-password
 * Purpose: Server-side password reset email. This is more reliable than the
 * client-side supabase.auth.resetPasswordForEmail() call because:
 *  - Uses the service-role admin client (no RLS/anon key dependency)
 *  - Server env vars are always available (no client-side inlining issues)
 *  - Proper console logging for debugging
 *  - Returns JSON so the client can show clear success/error states
 *
 * Input:  { email: string }
 * Output: { success: true, message } | { success: false, error }
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const redirectTo = `${APP_URL}/reset-password`;

    // Send the password reset email via Supabase admin API
    const { error } = await adminClient.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      console.error("Forgot-password API error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Always return success even if the email doesn't exist (prevents enumeration)
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (e: any) {
    console.error("Forgot-password exception:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Something went wrong" },
      { status: 500 }
    );
  }
}