"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  FileText,
  X,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import {
  getAllEscrowTransactions,
  releaseEscrow,
  refundEscrow,
  getPlatformCommissionRate,
} from "@/lib/services/payments";
import { getAllUsers } from "@/lib/services/users";
import { EscrowTransaction, UserProfile } from "@/types";
import {
  formatINR,
  formatRole,
  formatShortDate,
  escrowStatusVariant,
} from "@/lib/utils";

const ADMIN_ROLE = "SUPER_ADMIN";
const PAGE_SIZE = 10;
const HOUR_MS = 60 * 60 * 1000;

type PendingAction = { tx: EscrowTransaction; type: "RELEASE" | "REFUND" } | null;

export default function AdminEscrowPage() {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [commissionRate, setCommissionRate] = useState(5);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [invoiceTx, setInvoiceTx] = useState<EscrowTransaction | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Timestamp captured when data loads, so render stays pure. */
  const [loadedAt, setLoadedAt] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, usersData, rate] = await Promise.all([
        getAllEscrowTransactions(),
        getAllUsers(),
        getPlatformCommissionRate(),
      ]);
      setTransactions(txs);
      setUsers(usersData);
      setCommissionRate(rate);
      setLoadedAt(Date.now());
    } catch (err) {
      console.error(err);
      setError("Failed to load escrow transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer so the synchronous setLoading inside loadData runs after the effect body.
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  const usersById = useMemo(() => {
    const map = new Map<string, UserProfile>();
    users.forEach((u) => map.set(u.uid, u));
    return map;
  }, [users]);

  const nameOf = (uid: string) => usersById.get(uid)?.displayName ?? "Unknown User";

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setIsActing(true);
    setError(null);
    try {
      const { tx, type } = pendingAction;
      if (type === "RELEASE") {
        await releaseEscrow(tx.id);
        setTransactions(
          transactions.map((t) =>
            t.id === tx.id ? { ...t, status: "RELEASED" as const, releasedAt: Date.now() } : t
          )
        );
      } else {
        await refundEscrow(tx.id);
        setTransactions(
          transactions.map((t) =>
            t.id === tx.id ? { ...t, status: "REFUNDED" as const, releasedAt: Date.now() } : t
          )
        );
      }
      setPendingAction(null);
    } catch (err) {
      console.error(err);
      setError(
        pendingAction.type === "RELEASE"
          ? "Failed to release escrow."
          : "Failed to process refund."
      );
    } finally {
      setIsActing(false);
    }
  };

  const snapshot = useMemo(() => {
    const now = loadedAt || 0;
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const held = transactions.filter((t) => t.status === "HELD");
    const totalHeld = held.reduce((s, t) => s + t.amount, 0);
    const clearingSoon = held
      .filter((t) => now - t.createdAt < 48 * HOUR_MS)
      .reduce((s, t) => s + t.amount, 0);

    const releasedThisMonth = transactions.filter(
      (t) => t.status === "RELEASED" && (t.releasedAt ?? t.createdAt) >= monthStart.getTime()
    );
    const releasedTotal = releasedThisMonth.reduce((s, t) => s + t.amount, 0);
    const settledCount = transactions.filter((t) => t.status !== "HELD").length;
    const successRate =
      settledCount > 0
        ? Math.round(
            (transactions.filter((t) => t.status === "RELEASED").length / settledCount) * 1000
          ) / 10
        : 100;

    const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);

    return {
      totalHeld,
      clearingSoon,
      clearingPct: totalHeld > 0 ? Math.round((clearingSoon / totalHeld) * 100) : 0,
      releasedTotal,
      successRate,
      totalCommission,
    };
  }, [transactions, loadedAt]);

  const pageCount = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = transactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const txRef = (id: string) => `#TX-${id.slice(0, 6).toUpperCase()}`;

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
          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Escrow & Commission Hub</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Track held funds, settlements, and platform take-rate.
              </p>
            </div>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {/* Financial snapshot strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total in Escrow</p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                    {formatINR(snapshot.totalHeld)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#B45309]">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#F59E0B] transition-all"
                    style={{ width: `${snapshot.clearingPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {formatINR(snapshot.clearingSoon)} clearing in &lt;48h
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Released This Month</p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                    {formatINR(snapshot.releasedTotal)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#047857]">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#10B981] transition-all"
                    style={{ width: `${snapshot.successRate}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {snapshot.successRate}% settlement success rate
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Platform Take-Rate (Net)</p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                    {formatINR(snapshot.totalCommission)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#DC2626]">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#DC2626] transition-all"
                    style={{ width: `${Math.min(100, commissionRate)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {commissionRate}% flat commission fee
                </p>
              </div>
            </Card>
          </div>

          {/* Transaction settlement ledger */}
          <Card noPadding>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Settlement Ledger</h3>
                <p className="text-xs text-slate-500">
                  All escrow transactions with commission breakdown
                </p>
              </div>
              <Badge variant="indigo">{transactions.length} transactions</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Transaction</th>
                    <th className="px-4 py-3">Service / Route</th>
                    <th className="px-4 py-3">Payer &amp; Payee</th>
                    <th className="px-4 py-3">Gross / Cut</th>
                    <th className="px-4 py-3">Escrow State</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Settlement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {txRef(t.id)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{t.serviceName}</p>
                        <p className="text-xs text-slate-500">Provider: {nameOf(t.providerId)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">P:</span> {nameOf(t.payerId)}
                        </p>
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">R:</span> {nameOf(t.providerId)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{formatINR(t.amount)}</p>
                        <p className="text-xs text-slate-500">Cut: {formatINR(t.commission)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={escrowStatusVariant(t.status)} dot>
                          {formatRole(t.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatShortDate(t.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {t.status === "HELD" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setPendingAction({ tx: t, type: "RELEASE" })}
                              >
                                Release Funds
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => setPendingAction({ tx: t, type: "REFUND" })}
                              >
                                Dispute
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setInvoiceTx(t)}>
                              <FileText className="mr-1.5 h-4 w-4" /> View Invoice
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pageRows.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  No escrow transactions yet.
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                total={transactions.length}
                onPageChange={setPage}
              />
            </div>
          </Card>
        </div>

        {/* Release / dispute confirmation */}
        <ConfirmModal
          open={!!pendingAction}
          title={
            pendingAction?.type === "RELEASE" ? "Release escrow funds?" : "Dispute and refund?"
          }
          description={
            pendingAction?.type === "RELEASE"
              ? `Release ${pendingAction ? formatINR(pendingAction.tx.amount - pendingAction.tx.commission) : ""} to ${pendingAction ? nameOf(pendingAction.tx.providerId) : ""}. The platform keeps ${pendingAction ? formatINR(pendingAction.tx.commission) : ""} commission.`
              : `Refund the full ${pendingAction ? formatINR(pendingAction.tx.amount) : ""} to ${pendingAction ? nameOf(pendingAction.tx.payerId) : ""} and void this settlement.`
          }
          confirmLabel={pendingAction?.type === "RELEASE" ? "Release Funds" : "Refund Payer"}
          destructive={pendingAction?.type === "REFUND"}
          isLoading={isActing}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
        />

        {/* Invoice detail modal */}
        {invoiceTx && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setInvoiceTx(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Invoice ${txRef(invoiceTx.id)}`}
              className="w-full max-w-md rounded-xl border border-slate-200/60 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Invoice {txRef(invoiceTx.id)}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatShortDate(invoiceTx.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close invoice"
                  onClick={() => setInvoiceTx(null)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5 rounded-xl bg-slate-50/70 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-900">{invoiceTx.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payer</span>
                  <span className="font-medium text-slate-900">{nameOf(invoiceTx.payerId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payee</span>
                  <span className="font-medium text-slate-900">{nameOf(invoiceTx.providerId)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="text-slate-500">Gross Amount</span>
                  <span className="font-semibold text-slate-900">{formatINR(invoiceTx.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Cut ({commissionRate}%)</span>
                  <span className="font-medium text-[#B91C1C]">
                    -{formatINR(invoiceTx.commission)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="font-medium text-slate-900">Net to Provider</span>
                  <span className="font-semibold text-[#047857]">
                    {formatINR(invoiceTx.amount - invoiceTx.commission)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge variant={escrowStatusVariant(invoiceTx.status)} dot>
                  {formatRole(invoiceTx.status)}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setInvoiceTx(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
