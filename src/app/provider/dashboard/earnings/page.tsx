"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { getEscrowByProvider } from "@/lib/services/payments";
import { getServicesByProvider } from "@/lib/services/services";
import { EscrowTransaction } from "@/types";
import { IndianRupee, Wallet, TrendingUp, Clock } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderEarningsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [serviceCount, setServiceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [txs, services] = await Promise.all([getEscrowByProvider(user.uid), getServicesByProvider(user.uid)]);
        setTransactions(txs);
        setServiceCount(services.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const totalEarnings = transactions.filter((t) => t.status === "RELEASED").reduce((sum, t) => sum + (t.amount - t.commission), 0);
  const heldAmount = transactions.filter((t) => t.status === "HELD").reduce((sum, t) => sum + (t.amount - t.commission), 0);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title="Earnings">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Earnings & Payouts</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Total Released</p>
                  <p className="text-xl font-bold text-slate-900">₹{totalEarnings}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Held in Escrow</p>
                  <p className="text-xl font-bold text-slate-900">₹{heldAmount}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-[#3b4cca]"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Total Transactions</p>
                  <p className="text-xl font-bold text-slate-900">{transactions.length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><IndianRupee className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Active Services</p>
                  <p className="text-xl font-bold text-slate-900">{serviceCount}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Transaction History">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{t.serviceName}</p>
                      <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{t.amount - t.commission}</p>
                      <p className="text-xs text-slate-500">Commission: ₹{t.commission}</p>
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
