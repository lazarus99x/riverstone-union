import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-supabase";

export async function POST(request: Request) {
  try {
    const {
      fromUserId,
      bankName,
      accountName,
      accountNumber,
      routingNumber,
      amount,
      description,
    } = await request.json();

    // Validate required fields
    if (!fromUserId || !bankName || !accountName || !accountNumber || !routingNumber || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: fromUserId, bankName, accountName, accountNumber, routingNumber, amount" },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Get user's active bank accounts by profile UUID (fromUserId = profiles.id)
    const { data: accounts, error: acctError } = await adminClient
      .from("bank_accounts")
      .select("*")
      .eq("user_id", fromUserId)
      .eq("status", "active")
      .order("opened_at", { ascending: true });

    if (acctError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch accounts: ${acctError.message}` },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active accounts found for this user" },
        { status: 400 }
      );
    }

    // Use the first active account as the source
    const sourceAccount = accounts[0];

    // Check sufficient balance
    if (sourceAccount.balance < amountNum) {
      return NextResponse.json(
        { success: false, error: "Insufficient funds" },
        { status: 400 }
      );
    }

    // Generate transaction reference
    const ref = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Store external bank details in metadata
    const externalDetails = {
      bank_name: bankName,
      account_name: accountName,
      account_number: accountNumber,
      routing_number: routingNumber,
    };

    // Create the transaction (pending, pov_required, no to_account_id for external transfer)
    const { data: transaction, error: txError } = await adminClient
      .from("transactions")
      .insert({
        transaction_ref: ref,
        type: "transfer",
        status: "pending",
        amount: amountNum,
        from_account_id: sourceAccount.id,
        from_balance_before: sourceAccount.balance,
        from_balance_after: sourceAccount.balance - amountNum,
        description: description || `External transfer to ${accountName} at ${bankName}`,
        category: "transfer",
        pov_required: true,
        pov_verified: false,
        initiated_by: "user",
        metadata: externalDetails,
      })
      .select()
      .single();

    if (txError) {
      return NextResponse.json(
        { success: false, error: `Transaction failed: ${txError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      transactionRef: ref,
      message: "Transfer initiated",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}