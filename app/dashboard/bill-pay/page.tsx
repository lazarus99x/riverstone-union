"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Receipt, Clock, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BillPayee {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  status: string;
  category?: string;
  created_at: string;
}

export default function BillPayPage() {
  const { user } = useUser();
  const [bills, setBills] = useState<BillPayee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchBills = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bill_payees")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (!error && data) {
        setBills(data);
      }
      setIsLoading(false);
    };

    fetchBills();
  }, [user?.id]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 shadow-sm">
          <Receipt className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">Bill Pay</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage and pay your bills from one place.</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Bills</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading your bills..."
              : bills.length === 0
                ? "You have no scheduled bills. Add a payee to get started."
                : `You have ${bills.length} scheduled bill${bills.length !== 1 ? "s" : ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : bills.length > 0 ? (
            <>
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-bg-surface/50 p-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{bill.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Due {formatDate(bill.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary">
                      ${Number(bill.amount).toFixed(2)}
                    </span>
                    <Button size="sm" variant="outline" className="text-xs">
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="h-10 w-10 text-text-muted/40 mb-3" />
              <p className="text-sm text-text-muted">No payees added yet.</p>
            </div>
          )}
          <Button className="w-full h-11 rounded-xl">
            <ArrowRight className="h-4 w-4" />
            Add New Payee
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}