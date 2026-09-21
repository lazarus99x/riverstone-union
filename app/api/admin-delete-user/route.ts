import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

/**
 * POST /api/admin-delete-user
 * Purpose: Fully deletes a user from the system — transactions, bank accounts,
 * profile, and auth user record. Uses the Supabase admin API (service role).
 *
 * Input:  { userId: string } — the profile UUID (u.id from admin page)
 * Output: { success: boolean, message: string, error?: string }
 *
 * Why direct Supabase dashboard deletion fails:
 *   auth.users has FK constraints from profiles/bank_accounts/transactions.
 *   Without ON DELETE CASCADE, deleting from auth.users fails. This route
 *   deletes in the correct order to bypass that.
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

    // Step 1: Resolve the profile and auth user UUID
    // userId is the profile UUID (profiles.id) from the admin table
    const { data: profile, error: profileFindError } = await adminClient
      .from("profiles")
      .select("id, user_id, email")
      .eq("id", userId)
      .single();

    if (profileFindError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const authUserId = profile.user_id; // This is the auth.users UUID
    console.log(`[AdminDeleteUser] Deleting profile: ${profile.id}, auth user: ${authUserId}, email: ${profile.email}`);

    // Step 2: Find all bank accounts owned by this user (by profile UUID)
    const { data: accounts } = await adminClient
      .from("bank_accounts")
      .select("id")
      .eq("user_id", profile.id);

    const accountIds = (accounts || []).map((a: { id: string }) => a.id);
    console.log(`[AdminDeleteUser] Found ${accountIds.length} bank accounts`);

    // Step 3: Delete transactions linked to those accounts
    if (accountIds.length > 0) {
      // Delete transactions where account is source or destination
      for (const acctId of accountIds) {
        await adminClient
          .from("transactions")
          .delete()
          .or(`from_account_id.eq.${acctId},to_account_id.eq.${acctId}`);
      }
      console.log(`[AdminDeleteUser] Deleted transactions for ${accountIds.length} accounts`);
    }

    // Step 4: Delete bank accounts
    if (accountIds.length > 0) {
      await adminClient
        .from("bank_accounts")
        .delete()
        .eq("user_id", profile.id);
    }

    // Step 5: Delete profile
    await adminClient
      .from("profiles")
      .delete()
      .eq("id", profile.id);

    // Step 6: Delete the auth user (this requires service_role key)
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      authUserId
    );

    if (authDeleteError) {
      console.error("[AdminDeleteUser] Auth delete failed:", authDeleteError.message);
      // Profile and accounts are deleted — the remaining orphan auth user
      // can be cleaned up manually
      return NextResponse.json({
        success: true,
        warning: `Profile deleted but auth user removal failed: ${authDeleteError.message}`,
      });
    }

    console.log(`[AdminDeleteUser] User fully deleted: ${profile.email}`);
    return NextResponse.json({
      success: true,
      message: `User ${profile.email} permanently deleted`,
    });
  } catch (e: any) {
    console.error("[AdminDeleteUser] Exception:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Delete failed" },
      { status: 500 }
    );
  }
}