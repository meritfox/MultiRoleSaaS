"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getAllEscrowTransactions, releaseEscrow, refundEscrow } from "@/lib/services/payments";
import { EscrowTransaction } from "@/types";
import { Wallet, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const ADMIN_ROLE = "SUPER_ADMIN";

export default function AdminEscrowPage() {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getAllEscrowTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await releaseEscrow(id);
      setTransactions(transactions.map((t) => (t.id === id ? { ...t, status: "RELEASED" as const, releasedAt: Date.now() } : t)));
    } catch (err) {
      console.error(err);
      alert("Failed to release escrow.");
    }
  };

  const handleRefund = async (id: string) => {
    try {
      await refundEscrow(id);
      setTransactions(transactions.map((t) => (t.id === id ? { ...t, status: "REFUNDED" as const, releasedAt: Date.now() } : t)));
    } catch (err) {
      console.error(err);
      alert("Failed to refund escrow.");
    }
  };

  const totalHeld = transactions.filter((t) => t.status === "HELD").reduce((sum, t) => sum + t.amount, 0);
  const totalReleased = transactions.filter((t) => t.status === "RELEASED").reduce((sum, t) => sum + t.amount, 0);
  const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="Escrow & Commissions">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Escrow & Commissions</h2>
            <Button variant="outline" onClick={loadTransactions}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Held in Escrow</p>
                  <p className="text-xl font-bold text-slate-900">₹{totalHeld}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Released</p>
                  <p className="text-xl font-bold text-slate-900">₹{totalReleased}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-[#3b4cca]"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Platform Commission</p>
                  <p className="text-xl font-bold text-slate-900">₹{totalCommission}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="All Transactions">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No escrow transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-slate-50 gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{t.serviceName}</p>
                      <p className="text-xs text-slate-500">Amount: ₹{t.amount} • Commission: ₹{t.commission}</p>
                      <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.status === "RELEASED" ? "bg-emerald-100 text-emerald-700" : t.status === "HELD" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {t.status}
                      </span>
                      {t.status === "HELD" && (
                        <>
                          <Button size="sm" onClick={() => handleRelease(t.id)}><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="sm" variant="danger" onClick={() => handleRefund(t.id)}><XCircle className="h-4 w-4" /></Button>
                        </>
                      )}
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
