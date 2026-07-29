import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { createHash, randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();
    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Missing transaction ID" });
    }

    // Verify transaction exists
    const { data: tx, error: txError } = await adminClient
      .from("transactions")
      .select("id, status")
      .eq("id", transactionId)
      .single();

    if (txError || !tx) {
      return NextResponse.json({ success: false, error: "Transaction not found" });
    }

    // Generate a random 6-digit POV code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code for storage (SHA-256)
    const codeHash = createHash("sha256").update(code).digest("hex");

    // Set expiry to 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Upsert: remove old codes for this transaction, insert new one
    await adminClient.from("pov_codes").delete().eq("transaction_id", transactionId);
    const { error: insertError } = await adminClient.from("pov_codes").insert({
      transaction_id: transactionId,
      code_hash: codeHash,
      expires_at: expiresAt,
      max_attempts: 3,
    });

    if (insertError) {
      return NextResponse.json({ success: false, error: `Failed to create POV code: ${insertError.message}` });
    }

    // Mark transaction as requiring POV
    await adminClient.from("transactions").update({ pov_required: true }).eq("id", transactionId);

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      message: `POV code generated: ${code}`,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Server error" });
  }
}