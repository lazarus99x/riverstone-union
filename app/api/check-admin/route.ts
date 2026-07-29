import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ isAdmin: false });

    // Use service role key to bypass RLS on both tables
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ isAdmin: false });

    const { data: adminProfile } = await adminClient
      .from("admin_profiles")
      .select("role")
      .eq("user_id", profile.id)
      .single();

    return NextResponse.json({ isAdmin: adminProfile?.role === "admin" });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}