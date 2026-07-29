"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Landmark, ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Loan {
  id: string;
  user_id: string;
  name: string;
  loan_number: string;
  principal: number;
  remaining: number;
  monthly_payment: number;
  interest_rate: string;
  next_payment_date: string;
  status: string;
  created_at: string;
}

export default function LoansPage() {
  const { user } = useUser();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchLoans = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLoans(data);
      }
      setIsLoading(false);
    };

    fetchLoans();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 shadow-sm">
          <Landmark className="h-6 w-6 text-rose-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">Loans</h1>
          <p className="mt-1 text-sm text-text-secondary">View and manage your loans.</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-border">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </CardContent>
        </Card>
      ) : loans.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {loans.map((loan) => (
            <Card key={loan.id} className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">{loan.name}</CardTitle>
                <CardDescription>{loan.loan_number}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Principal</span>
                  <span className="font-medium text-text-primary">{formatCurrency(loan.principal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Remaining</span>
                  <span className="font-medium text-text-primary">{formatCurrency(loan.remaining)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Monthly Payment</span>
                  <span className="font-medium text-text-primary">{formatCurrency(loan.monthly_payment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Interest Rate</span>
                  <span className="font-medium text-text-primary">{loan.interest_rate}</span>
                </div>
                {loan.next_payment_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Next Payment</span>
                    <span className="font-medium text-text-primary">{formatDate(loan.next_payment_date)}</span>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-2">
                  {loan.status === "active" ? "Make Payment" : "View Details"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Landmark className="h-10 w-10 text-text-muted/40 mb-3" />
              <p className="text-sm text-text-muted">No active loans.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Apply for a Loan</CardTitle>
              <CardDescription>Find the right loan for your needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Personal Loan", "Home Mortgage", "Auto Loan", "Business Loan"].map((loanType) => (
                <div
                  key={loanType}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-surface/50 p-3"
                >
                  <span className="text-sm font-medium text-text-primary">{loanType}</span>
                  <span className="text-xs text-primary font-medium">Apply →</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {loans.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Apply for a New Loan</CardTitle>
            <CardDescription>Find the right loan for your needs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Personal Loan", "Home Mortgage", "Auto Loan", "Business Loan"].map((loanType) => (
              <div
                key={loanType}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface/50 p-3"
              >
                <span className="text-sm font-medium text-text-primary">{loanType}</span>
                <span className="text-xs text-primary font-medium">Apply →</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}