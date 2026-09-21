import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { generateAccountNumber } from "@/lib/account-number";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * POST /api/admin-create-user
 * Purpose: Admin creates a new user account directly from the admin dashboard.
 * Uses Supabase Admin API (service_role) to create the auth user, then provisions
 * profile and bank account identically to the self-registration flow, but with
 * created_by_admin=true so the audit trail is clean.
 * Input: { email, password, fullName, phone, accountType, currency }
 * Output: { success, userId, profileId, accountNumber }
 */
export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone, accountType, currency } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json({ success: false, error: "Email, password, and full name are required" });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" });
    }

    // Step 1: Create auth user via Supabase Admin API (service_role bypasses rate limits)
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for admin-created accounts
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return NextResponse.json({ success: false, error: `Auth creation failed: ${authError.message}` });
    }

    const authUserId = authUser.user.id;

    // Step 2: Create profile using admin client (identical to signUpAction but with created_by_admin)
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .insert({
        user_id: authUserId,
        email,
        full_name: fullName,
        phone: phone || null,
        kyc_status: "pending",
        created_by_admin: true,
      })
      .select()
      .single();

    if (profileError) {
      // Auth user created but profile failed — clean up by deleting auth user
      await adminClient.auth.admin.deleteUser(authUserId);
      return NextResponse.json({ success: false, error: `Profile creation failed: ${profileError.message}` });
    }

    // Step 3: Create bank account
    const accountNumber = await generateAccountNumber();
    const { error: accountError } = await adminClient
      .from("bank_accounts")
      .insert({
        user_id: profile.id,
        account_number: accountNumber,
        account_name: `${fullName} - ${accountType ? accountType.charAt(0).toUpperCase() + accountType.slice(1) : "Checking"}`,
        account_type: accountType || "checking",
        currency: currency || "USD",
        balance: 0,
        ledger_balance: 0,
        status: "active",
        daily_withdrawal_limit: 10000,
        monthly_withdrawal_limit: 50000,
      });

    if (accountError) {
      // Account creation failed but user exists — return partial success with warning
      return NextResponse.json({
        success: true,
        warning: `Account created but bank account setup pending: ${accountError.message}`,
        userId: authUserId,
        profileId: profile.id,
      });
    }

    // Send welcome email (async, doesn't block response)
    sendWelcomeEmail({
      email,
      fullName,
      accountNumber,
      accountType: accountType || "checking",
      temporaryPassword: password,
    }).then((sent) => {
      if (!sent) console.warn(`Welcome email not sent to ${email} — SMTP may not be configured`);
    });

    return NextResponse.json({
      success: true,
      userId: authUserId,
      profileId: profile.id,
      accountNumber,
    });
  } catch (e: any) {
    console.error("Admin create user failed:", e);
    return NextResponse.json({ success: false, error: e.message || "Failed to create user" });
  }
}