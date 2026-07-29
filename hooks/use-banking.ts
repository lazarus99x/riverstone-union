"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export interface BankAccount {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  currency: string;
  balance: number;
  ledger_balance: number;
  status: string;
  daily_withdrawal_limit: number;
  monthly_withdrawal_limit: number;
  opened_at: string;
}

export interface Transaction {
  id: string;
  transaction_ref: string;
  type: string;
  status: string;
  amount: number;
  from_account_id: string;
  to_account_id: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
  from_account?: BankAccount;
  to_account?: BankAccount;
}

const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

export function useAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get profile UUID first — bank_accounts.user_id references profiles.id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) { setLoading(false); setError("Profile not found"); return; }

    const { data, error: err } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", profile.id)
      .order("opened_at", { ascending: false });

    if (err) setError(err.message);
    else setAccounts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return { accounts, loading, error, totalBalance, fetchAccounts, fmt };
}

export function useRecentTransactions(limit = 10) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get profile UUID first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) { setLoading(false); return; }

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("user_id", profile.id);

      if (!accounts?.length) { setLoading(false); return; }

      const accountIds = accounts.map(a => a.id);
      const { data: txs } = await supabase
        .from("transactions")
        .select("*, from_account:bank_accounts!from_account_id(*), to_account:bank_accounts!to_account_id(*)")
        .or(`from_account_id.in.(${accountIds.join(",")}),to_account_id.in.(${accountIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(limit);

      setTransactions(txs || []);
      setLoading(false);
    }
    fetch();
  }, [limit]);

  return { transactions, loading, fmt };
}