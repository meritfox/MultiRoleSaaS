"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { escrowStatusVariant } from "@/lib/utils";
import {
  getEscrowByPayer,
  createEscrowTransaction,
  getPlatformCommissionRate,
} from "@/lib/services/payments";
import { getAllServices } from "@/lib/services/services";
import { EscrowTransaction, Service, RATE_UNIT_LABELS } from "@/types";
import { IndianRupee, CreditCard, Wallet, ShieldCheck } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

type Stage = "select" | "review" | "confirmed";

export default function StudentPaymentsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [commissionRate, setCommissionRate] = useState(5);
  const [loading, setLoading] = useState(true);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [stage, setStage] = useState<Stage>("select");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTx, setConfirmedTx] = useState<EscrowTransaction | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [txs, allServices, rate] = await Promise.all([
          getEscrowByPayer(user.uid),
          getAllServices(),
          getPlatformCommissionRate().catch(() => 5),
        ]);
        setTransactions(txs);
        setServices(allServices);
        setCommissionRate(rate);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const estimatedCommission = selectedService
    ? Math.round((selectedService.price * commissionRate) / 100)
    : 0;

  const handleReview = () => {
    if (!selectedServiceId) return;
    setStage("review");
  };

  const handleConfirmPay = async () => {
    if (!user || !selectedService) return;
    setPaying(true);
    setError(null);
    try {
      const tx = await createEscrowTransaction(
        user.uid,
        selectedService.providerId,
        selectedService.name,
        selectedService.price
      );
      setConfirmedTx(tx);
      setTransactions([tx, ...transactions]);
      setStage("confirmed");
    } catch (err) {
      console.error(err);
      setError("Failed to process payment.");
    } finally {
      setPaying(false);
    }
  };

  const resetFlow = () => {
    setSelectedServiceId("");
    setConfirmedTx(null);
    setStage("select");
  };

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
  const heldCount = transactions.filter((t) => t.status === "HELD").length;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="OmniStud Payment Engine">
        <div className="max-w-3xl mx-auto space-y-6">
          <PageHeader
            title="Payments and escrow"
            description="Secure payments for your services, held in OmniStud Escrow."
          />

          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Total Paid"
              value={`₹${totalPaid}`}
              icon={<CreditCard className="h-5 w-5" />}
              iconClassName="bg-red-100/70 text-[#DC2626]"
            />
            <KpiCard
              label="Active Escrows"
              value={String(heldCount)}
              icon={<Wallet className="h-5 w-5" />}
              iconClassName="bg-emerald-100/70 text-emerald-600"
            />
          </div>

          {stage === "confirmed" && confirmedTx ? (
            <Card title="Escrow Confirmation">
              <div className="space-y-4">
                <Alert variant="success">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    Payment securely held in OmniStud Escrow
                  </div>
                  <p className="text-xs mt-1">
                    ₹{confirmedTx.amount} for {confirmedTx.serviceName}. ₹{confirmedTx.commission}
                    platform commission included. Funds release on service completion.
                  </p>
                </Alert>
                <div className="rounded-xl bg-slate-50/70 p-4 text-sm space-y-1">
                  <p className="flex justify-between"><span>Transaction ID</span><span className="font-mono text-xs">{confirmedTx.id}</span></p>
                  <p className="flex justify-between"><span>Service</span><span className="font-medium">{confirmedTx.serviceName}</span></p>
                  <p className="flex justify-between"><span>Amount</span><span className="font-medium">₹{confirmedTx.amount}</span></p>
                  <p className="flex justify-between"><span>Commission</span><span className="font-medium">₹{confirmedTx.commission}</span></p>
                  <p className="flex justify-between">
                    <span>Status</span>
                    <Badge variant="warning" dot>
                      HELD IN ESCROW
                    </Badge>
                  </p>
                </div>
                <Button variant="outline" onClick={resetFlow} className="w-full">
                  Make another payment
                </Button>
              </div>
            </Card>
          ) : stage === "review" && selectedService ? (
            <Card title="Review & Confirm Payment">
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200/60 p-4 text-sm space-y-1">
                  <p className="flex justify-between"><span>Service</span><span className="font-medium">{selectedService.name}</span></p>
                  <p className="flex justify-between">
                    <span>Amount</span>
                    <span className="font-medium">
                      ₹{selectedService.price}
                      {selectedService.rateUnit ? ` / ${RATE_UNIT_LABELS[selectedService.rateUnit]}` : ""}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Platform commission ({commissionRate}%)</span>
                    <span className="font-medium">₹{estimatedCommission}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConfirmPay} isLoading={paying} className="flex-1">
                    <IndianRupee className="mr-2 h-4 w-4" /> Confirm & Pay
                  </Button>
                  <Button variant="outline" onClick={() => setStage("select")}>
                    Back
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Amount held in OmniStud Escrow until service completion. Demo gateway.
                </p>
              </div>
            </Card>
          ) : (
            <Card title="Pay for a Service">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Select Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                  >
                    <option value="">-- Select a service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - ₹{s.price}
                        {s.rateUnit ? `/${RATE_UNIT_LABELS[s.rateUnit]}` : ""} ({s.providerType})
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleReview} disabled={!selectedServiceId} className="w-full">
                  Review Payment
                </Button>
              </div>
            </Card>
          )}

          <Card title="Payment History">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70">
                    <div>
                      <p className="font-medium text-slate-900">{t.serviceName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()} · Commission ₹{t.commission}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{t.amount}</p>
                      <Badge variant={escrowStatusVariant(t.status)} dot>
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
