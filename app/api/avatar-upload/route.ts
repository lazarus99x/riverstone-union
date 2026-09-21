import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

/**
 * POST /api/avatar-upload
 * Purpose: Handles avatar upload for users. Accepts a multipart form with:
 *   - file: the image file (jpeg, png, gif, webp only, max 2MB)
 *   - userId: the auth UUID of the user (for server-side admin override, or current user)
 *   - isAdminOverride: boolean flag to allow admin to set any user's avatar
 * Validates file type and size, uploads to Supabase Storage avatars bucket,
 * updates the profile record with the new avatar_url.
 * Output: { success, avatarUrl }
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const isAdminOverride = formData.get("isAdminOverride") === "true";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
      });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: "File too large. Maximum size is 2MB",
      });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" });
    }

    // Determine upload path
    // User ID for storage path — use auth UUID for user folder, profile UUID for admin overrides
    const storageUserId = userId;

    // Generate unique filename
    const ext = file.type.split("/")[1] || "png";
    const fileName = `avatar.${ext}`;
    const filePath = `${storageUserId}/${fileName}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to storage bucket using admin client (bypasses RLS for admin,
    // but we still want the path to match the user's folder)
    const { error: uploadError } = await adminClient.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow replacing existing avatar
      });

    if (uploadError) {
      return NextResponse.json({ success: false, error: `Upload failed: ${uploadError.message}` });
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null;

    if (!avatarUrl) {
      return NextResponse.json({ success: false, error: "Failed to generate public URL" });
    }

    // Update profile's avatar_url
    // Determine if userId is auth UUID or profile UUID by checking both
    const { data: profileByAuth } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileByAuth) {
      // userId is auth UUID — update by auth UUID
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", userId);
      if (updateError) {
        return NextResponse.json({ success: false, error: `Profile update failed: ${updateError.message}` });
      }
    } else {
      // Try as profile UUID
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);
      if (updateError) {
        return NextResponse.json({ success: false, error: `Profile update failed: ${updateError.message}` });
      }
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (e: any) {
    console.error("Avatar upload failed:", e);
    return NextResponse.json({ success: false, error: e.message || "Upload failed" });
  }
}