"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getEscrowByPayer, createEscrowTransaction } from "@/lib/services/payments";
import { EscrowTransaction } from "@/types";
import { getAllServices } from "@/lib/services/services";
import { Service } from "@/types";
import { IndianRupee, CreditCard, Wallet } from "lucide-react";

const PARENT_ROLE = "PARENT";

export default function ParentPaymentsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [txs, allServices] = await Promise.all([getEscrowByPayer(user.uid), getAllServices()]);
        setTransactions(txs);
        setServices(allServices);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handlePay = async () => {
    if (!user || !selectedService) return;
    const service = services.find((s) => s.id === selectedService);
    if (!service) return;
    setPaying(true);
    try {
      const tx = await createEscrowTransaction(user.uid, service.providerId, service.name, service.price);
      setTransactions([tx, ...transactions]);
      setSelectedService("");
    } catch (err) {
      console.error(err);
      alert("Failed to process payment.");
    } finally {
      setPaying(false);
    }
  };

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[PARENT_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PARENT_ROLE]}>
      <DashboardLayout title="Payments">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Payments & Escrow</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-[#3b4cca]"><CreditCard className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Total Paid</p>
                  <p className="text-xl font-bold text-slate-900">₹{totalPaid}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Active Escrows</p>
                  <p className="text-xl font-bold text-slate-900">{transactions.filter((t) => t.status === "HELD").length}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Pay for a Service">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Select Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#3b4cca] focus:outline-none focus:ring-1 focus:ring-[#3b4cca]"
                >
                  <option value="">-- Select a service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ₹{s.price} ({s.providerType})
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handlePay} isLoading={paying} disabled={!selectedService} className="w-full">
                <IndianRupee className="mr-2 h-4 w-4" /> Pay via Demo Gateway
              </Button>
              <p className="text-xs text-slate-500">This is a demo payment. No real money is deducted.</p>
            </div>
          </Card>

          <Card title="Payment History">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{t.serviceName}</p>
                      <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{t.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "RELEASED" ? "bg-emerald-100 text-emerald-700" : t.status === "HELD" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {t.status}
                      </span>
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
