"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { AppSettings, UserProfile, EscrowTransaction, SubscriptionConfig } from "@/types";
import { releaseEscrow, refundEscrow } from "@/lib/services/payments";
import { Users, Settings, IndianRupee, Shield, Trash2, CheckCircle, XCircle, Clock, TrendingUp, CreditCard, Wallet, Activity, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

const ADMIN_ROLE = "SUPER_ADMIN";

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          };
          await setDoc(docRef, defaultSettings);
          setSettings(defaultSettings);
          setNewFee("100");
          setNewProviderTypes("teacher, driver, tutor, institution");
          setNewAdminKey("ADMIN123");
        }

        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);
        const usersData = usersSnap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        })) as UserProfile[];
        setUsers(usersData);

        const escrowRef = collection(db, "escrow");
        const escrowSnap = await getDocs(escrowRef);
        const escrowData = escrowSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EscrowTransaction[];
        setEscrowTransactions(escrowData);

        const plansRef = collection(db, "subscriptionPlans");
        const plansSnap = await getDocs(plansRef);
        const plansData = plansSnap.docs.map((d) => d.data() as SubscriptionConfig);
        setSubscriptionPlans(plansData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch dashboard data.");
      } finally {
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
      if (isNaN(commission) || commission < 0 || commission > 100) throw new Error("Invalid platform commission. Must be 0-100.");

      const updatedSettings: AppSettings = {
        registrationFee: fee,
        allowedServiceProviderTypes: providerTypes,
        maintenanceMode: settings?.maintenanceMode || false,
        adminKey: newAdminKey.trim(),
        platformCommission: commission,
      };

      await setDoc(doc(db, "settings", "app_settings"), updatedSettings);
      setSettings(updatedSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers(users.filter((u) => u.uid !== uid));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user.");
    }
  };

  const handleTogglePayment = async (uid: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
      await updateDoc(doc(db, "users", uid), {
        paymentStatus: newStatus,
        updatedAt: Date.now(),
      });
      setUsers(
        users.map((u) =>
          u.uid === uid ? { ...u, paymentStatus: newStatus as any } : u
        )
      );
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("Failed to update payment status.");
    }
  };

  const handleReleaseEscrow = async (txId: string) => {
    try {
      await releaseEscrow(txId);
      setEscrowTransactions(escrowTransactions.map((tx) => (tx.id === txId ? { ...tx, status: "RELEASED", releasedAt: Date.now() } : tx)));
    } catch (err) {
      console.error("Error releasing escrow:", err);
      setError("Failed to release escrow.");
    }
  };

  const handleRefundEscrow = async (txId: string) => {
    try {
      await refundEscrow(txId);
      setEscrowTransactions(escrowTransactions.map((tx) => (tx.id === txId ? { ...tx, status: "REFUNDED", releasedAt: Date.now() } : tx)));
    } catch (err) {
      console.error("Error refunding escrow:", err);
      setError("Failed to refund escrow.");
    }
  };

  const totalUsers = users.length;
  const activeSubscribers = users.filter((u) => u.paymentStatus === "COMPLETED").length;
  const totalEscrow = escrowTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalCommission = escrowTransactions.reduce((sum, tx) => sum + tx.commission, 0);
  const platformHealth = "Operational";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="Super Admin Control Panel">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Super Admin Control Panel</h2>
            <p className="text-slate-600">Manage users, subscriptions, escrow, and platform settings.</p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">Settings updated successfully!</Alert>}

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 text-[#3b4cca]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Active Subscribers</p>
                  <p className="text-2xl font-bold text-slate-900">{activeSubscribers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Commission Earned</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{totalCommission}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Funds in Escrow</p>
                  <p className="text-2xl font-bold text-slate-900">₹{totalEscrow}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* User Management */}
            <div className="xl:col-span-2 space-y-6">
              <Card title="User Management" description="Manage all platform users">
                <div className="mb-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/dashboard/users">
                      View All Users <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {users.length === 0 ? (
                  <p className="text-center text-slate-500">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-slate-700">User ID</th>
                          <th className="pb-3 font-medium text-slate-700">Name</th>
                          <th className="pb-3 font-medium text-slate-700">Role</th>
                          <th className="pb-3 font-medium text-slate-700">Status</th>
                          <th className="pb-3 font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 5).map((u) => (
                          <tr key={u.uid} className="border-b last:border-0">
                            <td className="py-3 font-mono text-xs text-slate-500">{u.uid.slice(0, 8)}</td>
                            <td className="py-3 font-medium text-slate-900">{u.displayName}</td>
                            <td className="py-3">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">
                                {u.role.toLowerCase().replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => handleTogglePayment(u.uid, u.paymentStatus)}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  u.paymentStatus === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {u.paymentStatus === "COMPLETED" ? "Active" : "Pending"}
                              </button>
                            </td>
                            <td className="py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(u.uid)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Escrow Release */}
              <Card title="Escrow Release & Commission Tracking" description="Manage pending releases to providers">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-600">Total Funds in Escrow</p>
                    <p className="text-2xl font-bold text-slate-900">₹{totalEscrow}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-600">OmniStud Commission Balance</p>
                    <p className="text-2xl font-bold text-slate-900">₹{totalCommission}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {escrowTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{tx.serviceName}</p>
                        <p className="text-sm text-slate-500">Amount: ₹{tx.amount} • Commission: ₹{tx.commission}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.status === "RELEASED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {tx.status}
                        </span>
                        {tx.status === "HELD" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReleaseEscrow(tx.id)}>
                              Release
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleRefundEscrow(tx.id)}>
                              Refund
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {escrowTransactions.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No escrow transactions found.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Platform Settings */}
              <Card title="Platform Settings">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Registration Fee (₹)</label>
                    <Input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      placeholder="e.g. 100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Allowed Service Provider Types</label>
                    <Input
                      type="text"
                      value={newProviderTypes}
                      onChange={(e) => setNewProviderTypes(e.target.value)}
                      placeholder="e.g. teacher, driver, tutor"
                    />
                    <p className="text-xs text-slate-500">Enter types separated by commas.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Admin Registration Key</label>
                    <Input
                      type="text"
                      value={newAdminKey}
                      onChange={(e) => setNewAdminKey(e.target.value)}
                      placeholder="e.g. ADMIN123"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Platform Escrow Commission Fee (%)</label>
                    <Input
                      type="number"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>

                  <Button className="w-full" onClick={handleSaveSettings} isLoading={isSaving}>
                    Save Settings
                  </Button>
                </div>
              </Card>

              {/* Subscription Plans */}
              <Card title="Subscription Plan Configuration">
                <div className="space-y-3">
                  {subscriptionPlans.map((plan) => (
                    <div key={plan.plan} className="p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500">{plan.plan}</p>
                        </div>
                        <span className="text-lg font-bold text-[#3b4cca]">₹{plan.monthlyPrice}/mo</span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {plan.features.slice(0, 3).map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href="/admin/dashboard/subscriptions">Manage Plans</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href="/admin/dashboard/escrow">Escrow</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
