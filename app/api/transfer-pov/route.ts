import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { transactionId, code } = await request.json();

    if (!transactionId || !code) {
      return NextResponse.json(
        { success: false, error: "Missing transactionId or code" },
        { status: 400 }
      );
    }

    // Verify transaction exists and is pending
    const { data: tx, error: txError } = await adminClient
      .from("transactions")
      .select("id, status, pov_required, pov_verified, type")
      .eq("id", transactionId)
      .single();

    if (txError || !tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (tx.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Transaction is not in pending status" },
        { status: 400 }
      );
    }

    if (!tx.pov_required) {
      return NextResponse.json(
        { success: false, error: "This transaction does not require POV verification" },
        { status: 400 }
      );
    }

    if (tx.pov_verified) {
      return NextResponse.json(
        { success: false, error: "POV already verified for this transaction" },
        { status: 400 }
      );
    }

    // Get POV code record
    const { data: povCodeRecord, error: povError } = await adminClient
      .from("pov_codes")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (povError || !povCodeRecord) {
      return NextResponse.json(
        { success: false, error: "POV code not found for this transaction" },
        { status: 404 }
      );
    }

    // Check expiry
    if (new Date(povCodeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "POV code has expired" },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (povCodeRecord.attempts >= povCodeRecord.max_attempts) {
      return NextResponse.json(
        { success: false, error: "Maximum POV attempts exceeded. Contact your admin for a new code." },
        { status: 400 }
      );
    }

    // Hash the provided code with SHA-256 and compare
    const codeHash = createHash("sha256").update(code).digest("hex");

    if (codeHash !== povCodeRecord.code_hash) {
      // Increment attempts
      const newAttempts = povCodeRecord.attempts + 1;
      await adminClient
        .from("pov_codes")
        .update({ attempts: newAttempts })
        .eq("id", povCodeRecord.id);

      const remaining = povCodeRecord.max_attempts - newAttempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid POV code. ${remaining > 0 ? `${remaining} attempts remaining` : "No attempts remaining. Contact your admin for a new code."}`,
        },
        { status: 400 }
      );
    }

    // Code is valid — mark POV as used
    await adminClient
      .from("pov_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", povCodeRecord.id);

    // Complete the transaction
    await adminClient
      .from("transactions")
      .update({
        status: "completed",
        pov_verified: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    return NextResponse.json({
      success: true,
      message: "Transfer completed",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}