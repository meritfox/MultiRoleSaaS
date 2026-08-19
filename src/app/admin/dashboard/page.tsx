"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  CreditCard,
  TrendingUp,
  Wallet,
  Download,
  ArrowRight,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/Toggle";
import { Select } from "@/components/ui/Select";
import { KpiCard } from "@/components/ui/KpiCard";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { AppSettings, UserProfile, EscrowTransaction } from "@/types";
import {
  formatINR,
  formatRole,
  formatShortDate,
  roleBadgeVariant,
  escrowStatusVariant,
  percentChange,
} from "@/lib/utils";

const ADMIN_ROLE = "SUPER_ADMIN";
const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

export default function AdminDashboard() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rangeDays, setRangeDays] = useState(30);
  /** Timestamp captured when data loads, so render stays pure. */
  const [loadedAt, setLoadedAt] = useState(0);

  const [newFee, setNewFee] = useState<string>("");
  const [newProviderTypes, setNewProviderTypes] = useState<string>("");
  const [newAdminKey, setNewAdminKey] = useState<string>("");
  const [platformFee, setPlatformFee] = useState<string>("5");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "app_settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          setSettings(data);
          setNewFee(data.registrationFee.toString());
          setNewProviderTypes(data.allowedServiceProviderTypes.join(", "));
          setNewAdminKey(data.adminKey || "ADMIN123");
          setPlatformFee((data.platformCommission ?? 5).toString());
        } else {
          const defaultSettings: AppSettings = {
            registrationFee: 100,
            allowedServiceProviderTypes: ["teacher", "driver", "tutor", "institution"],
            maintenanceMode: false,
            adminKey: "ADMIN123",
            platformCommission: 5,
            instantEscrowRelease: false,
          };
          await setDoc(docRef, defaultSettings);
          setSettings(defaultSettings);
          setNewFee("100");
          setNewProviderTypes("teacher, driver, tutor, institution");
          setNewAdminKey("ADMIN123");
        }

        const usersSnap = await getDocs(collection(db, "users"));
        setUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[]);

        const escrowSnap = await getDocs(collection(db, "escrow"));
        setEscrowTransactions(
          escrowSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as EscrowTransaction[]
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch dashboard data.");
      } finally {
        setLoadedAt(Date.now());
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const fee = parseFloat(newFee);
      if (isNaN(fee)) throw new Error("Invalid registration fee.");

      const providerTypes = newProviderTypes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (!newAdminKey.trim()) throw new Error("Admin key cannot be empty.");

      const commission = parseFloat(platformFee);
      if (isNaN(commission) || commission < 0 || commission > 100)
        throw new Error("Invalid platform commission. Must be 0-100.");

      const updatedSettings: AppSettings = {
        registrationFee: fee,
        allowedServiceProviderTypes: providerTypes,
        maintenanceMode: settings?.maintenanceMode || false,
        instantEscrowRelease: settings?.instantEscrowRelease || false,
        adminKey: newAdminKey.trim(),
        platformCommission: commission,
      };

      await setDoc(doc(db, "settings", "app_settings"), updatedSettings);
      setSettings(updatedSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSetting = async (
    field: "maintenanceMode" | "instantEscrowRelease",
    value: boolean
  ) => {
    try {
      await updateDoc(doc(db, "settings", "app_settings"), { [field]: value });
      setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
    } catch (err) {
      console.error("Error updating setting:", err);
      setError("Failed to update setting.");
    }
  };

  const usersById = useMemo(() => {
    const map = new Map<string, UserProfile>();
    users.forEach((u) => map.set(u.uid, u));
    return map;
  }, [users]);

  const nameOf = (uid: string) => usersById.get(uid)?.displayName ?? "Unknown User";

  const metrics = useMemo(() => {
    const now = loadedAt || 0;
    const rangeMs = rangeDays * DAY_MS;
    const inCur = (ts: number) => ts >= now - rangeMs && ts <= now;
    const inPrev = (ts: number) => ts >= now - 2 * rangeMs && ts < now - rangeMs;

    const usersCur = users.filter((u) => inCur(u.createdAt)).length;
    const usersPrev = users.filter((u) => inPrev(u.createdAt)).length;

    const commissionCur = escrowTransactions
      .filter((t) => inCur(t.createdAt))
      .reduce((s, t) => s + t.commission, 0);
    const commissionPrev = escrowTransactions
      .filter((t) => inPrev(t.createdAt))
      .reduce((s, t) => s + t.commission, 0);

    const activeSubscribers = users.filter((u) => u.paymentStatus === "COMPLETED").length;
    const conversion = users.length ? Math.round((activeSubscribers / users.length) * 100) : 0;

    const heldTxs = escrowTransactions.filter((t) => t.status === "HELD");
    const escrowHeld = heldTxs.reduce((s, t) => s + t.amount, 0);
    const totalCommission = escrowTransactions.reduce((s, t) => s + t.commission, 0);

    return {
      usersCur,
      userTrend: percentChange(usersCur, usersPrev),
      activeSubscribers,
      conversion,
      totalCommission,
      commissionTrend: percentChange(commissionCur, commissionPrev),
      escrowHeld,
      heldCount: heldTxs.length,
    };
  }, [users, escrowTransactions, rangeDays, loadedAt]);

  const chartData = useMemo(() => {
    const startOfToday = new Date(loadedAt || 0);
    startOfToday.setHours(0, 0, 0, 0);
    const buckets: { label: string; inflow: number; commission: number }[] = [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const dayStart = startOfToday.getTime() - i * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const txs = escrowTransactions.filter(
        (t) => t.createdAt >= dayStart && t.createdAt < dayEnd
      );
      buckets.push({
        label: new Date(dayStart).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        inflow: txs.reduce((s, t) => s + t.amount, 0),
        commission: txs.reduce((s, t) => s + t.commission, 0),
      });
    }
    return buckets;
  }, [escrowTransactions, rangeDays, loadedAt]);

  const recentEscrow = useMemo(
    () => [...escrowTransactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    [escrowTransactions]
  );

  const recentUsers = useMemo(
    () => [...users].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [users]
  );

  const trendLabel = (pct: number | null) =>
    pct === null ? null : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs prev. period`;

  const compactAxis = (v: number) =>
    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`;

  const exportReport = () => {
    const rows: string[][] = [
      ["OmniStud Admin Report", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Value"],
      ["Total Users", String(users.length)],
      ["Active Subscriptions", String(metrics.activeSubscribers)],
      ["Conversion Rate", `${metrics.conversion}%`],
      ["Platform Commission (INR)", String(metrics.totalCommission)],
      ["Escrow Balance Held (INR)", String(metrics.escrowHeld)],
      ["Settlements Pending", String(metrics.heldCount)],
      [],
      ["Transaction ID", "Service", "Payer", "Payee", "Amount (INR)", "Commission (INR)", "Status", "Date"],
      ...escrowTransactions.map((t) => [
        t.id,
        t.serviceName,
        nameOf(t.payerId),
        nameOf(t.providerId),
        String(t.amount),
        String(t.commission),
        t.status,
        new Date(t.createdAt).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnistud-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  const userTrendText = trendLabel(metrics.userTrend);
  const commissionTrendText = trendLabel(metrics.commissionTrend);

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="Overview">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Admin Console <span className="mx-1 text-slate-300">/</span> Overview
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Executive Dashboard</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Platform health, escrow velocity, and moderation at a glance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                options={RANGE_OPTIONS}
                value={String(rangeDays)}
                onChange={(e) => setRangeDays(Number(e.target.value))}
                className="w-40"
                aria-label="Date range"
              />
              <Button variant="outline" onClick={exportReport}>
                <Download className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">Settings saved successfully.</Alert>}

          {/* KPI metrics bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Users"
              value={users.length.toLocaleString("en-IN")}
              icon={<Users className="h-5 w-5" />}
              iconClassName="bg-[#EEF2FF] text-[#DC2626]"
              trend={
                userTrendText
                  ? {
                      label: userTrendText,
                      direction: (metrics.userTrend ?? 0) >= 0 ? "up" : "down",
                      positive: (metrics.userTrend ?? 0) >= 0,
                    }
                  : undefined
              }
              subtext={`${metrics.usersCur} new this period`}
            />
            <KpiCard
              label="Active Subscriptions"
              value={metrics.activeSubscribers.toLocaleString("en-IN")}
              icon={<CreditCard className="h-5 w-5" />}
              iconClassName="bg-purple-50 text-purple-600"
              subtext={`${metrics.conversion}% conversion rate`}
            />
            <KpiCard
              label="Platform Commission"
              value={formatINR(metrics.totalCommission)}
              icon={<TrendingUp className="h-5 w-5" />}
              iconClassName="bg-[#ECFDF5] text-[#047857]"
              trend={
                commissionTrendText
                  ? {
                      label: commissionTrendText,
                      direction: (metrics.commissionTrend ?? 0) >= 0 ? "up" : "down",
                      positive: (metrics.commissionTrend ?? 0) >= 0,
                    }
                  : undefined
              }
            />
            <KpiCard
              label="Escrow Balance"
              value={formatINR(metrics.escrowHeld)}
              icon={<Wallet className="h-5 w-5" />}
              iconClassName="bg-[#FFFBEB] text-[#B45309]"
              subtext={`${metrics.heldCount} settlements pending`}
            />
          </div>

          {/* Revenue chart + live transaction feed */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card
              className="xl:col-span-2"
              title="Revenue & Escrow Velocity"
              description={`Escrow inflow vs commission realized — last ${rangeDays} days`}
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#DC2626" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={compactAxis}
                      width={56}
                    />
                    <Tooltip
                      formatter={(value) => formatINR(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        fontSize: 13,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="inflow"
                      name="Escrow Inflow"
                      stroke="#DC2626"
                      strokeWidth={2}
                      fill="url(#gradInflow)"
                    />
                    <Area
                      type="monotone"
                      dataKey="commission"
                      name="Commission Realized"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#gradCommission)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-5 border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" /> Escrow Inflow
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Commission Realized
                </span>
              </div>
            </Card>

            {/* Live transaction feed */}
            <Card noPadding>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-900">Recent Escrow Movements</h3>
                <Link
                  href="/admin/dashboard/escrow"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#DC2626] hover:underline"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentEscrow.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{tx.serviceName}</p>
                      <p className="truncate text-xs text-slate-500">
                        Parent: {nameOf(tx.payerId)} · {formatShortDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatINR(tx.amount)}
                      </span>
                      <Badge variant={escrowStatusVariant(tx.status)} dot>
                        {formatRole(tx.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentEscrow.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-slate-500">
                    No escrow activity yet.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Quick moderation + platform settings */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Recent registrations */}
            <Card noPadding>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Recent User Registrations</h3>
                  <p className="text-xs text-slate-500">Latest signups across all roles</p>
                </div>
                <Link
                  href="/admin/dashboard/users"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#DC2626] hover:underline"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentUsers.map((u) => (
                      <tr key={u.uid} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.displayName} src={u.photoURL} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{u.displayName}</p>
                              <p className="truncate text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={roleBadgeVariant(u.role)}>{formatRole(u.role)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.blocked ? (
                            <Badge variant="danger" dot>Suspended</Badge>
                          ) : u.paymentStatus === "COMPLETED" ? (
                            <Badge variant="success" dot>Verified</Badge>
                          ) : (
                            <Badge variant="warning" dot>Pending</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatShortDate(u.createdAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/admin/dashboard/users">Review</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentUsers.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-slate-500">No users found.</p>
                )}
              </div>
            </Card>

            {/* System configuration */}
            <Card title="System Configuration" description="Quick toggles and platform fee controls">
              <div className="space-y-5">
                <Toggle
                  label="Maintenance Mode"
                  description="Temporarily disable public access to the platform."
                  checked={settings?.maintenanceMode ?? false}
                  onChange={(v) => handleToggleSetting("maintenanceMode", v)}
                />
                <Toggle
                  label="Instant Escrow Release"
                  description="Auto-release funds when a service is marked complete."
                  checked={settings?.instantEscrowRelease ?? false}
                  onChange={(v) => handleToggleSetting("instantEscrowRelease", v)}
                />

                <div className="border-t border-slate-100 pt-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Registration Fee (₹)"
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      placeholder="e.g. 100"
                    />
                    <Input
                      label="Platform Commission (%)"
                      type="number"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="mt-4 space-y-4">
                    <Input
                      label="Allowed Service Provider Types"
                      type="text"
                      value={newProviderTypes}
                      onChange={(e) => setNewProviderTypes(e.target.value)}
                      placeholder="e.g. teacher, driver, tutor"
                    />
                    <Input
                      label="Admin Registration Key"
                      type="text"
                      value={newAdminKey}
                      onChange={(e) => setNewAdminKey(e.target.value)}
                      placeholder="e.g. ADMIN123"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button className="flex-1" onClick={handleSaveSettings} isLoading={isSaving}>
                    Save Settings
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/dashboard/subscriptions">Manage Plans</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
