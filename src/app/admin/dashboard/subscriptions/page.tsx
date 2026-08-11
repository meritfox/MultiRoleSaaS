"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { SubscriptionConfig, SubscriptionPlan } from "@/types";
import { CreditCard } from "lucide-react";

const ADMIN_ROLE = "SUPER_ADMIN";

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const snap = await getDocs(collection(db, "subscriptionPlans"));
      setPlans(snap.docs.map((d) => d.data() as SubscriptionConfig));
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleUpdate = async (plan: SubscriptionPlan, field: keyof SubscriptionConfig, value: any) => {
    const updated = plans.map((p) => (p.plan === plan ? { ...p, [field]: value } : p));
    setPlans(updated);
  };

  const handleSave = async (plan: SubscriptionConfig) => {
    await setDoc(doc(collection(db, "subscriptionPlans"), plan.plan), plan);
    alert(`Plan ${plan.plan} saved.`);
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

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="Subscription Plans">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Subscription Plans</h2>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.plan} title={plan.name}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-[#3b4cca]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase text-slate-500">{plan.plan}</span>
                  </div>
                  <Input
                    label="Monthly Price (₹)"
                    type="number"
                    value={plan.monthlyPrice}
                    onChange={(e) => handleUpdate(plan.plan, "monthlyPrice", parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Yearly Price (₹)"
                    type="number"
                    value={plan.yearlyPrice}
                    onChange={(e) => handleUpdate(plan.plan, "yearlyPrice", parseFloat(e.target.value) || 0)}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700">Features (one per line)</label>
                    <textarea
                      rows={4}
                      value={plan.features.join("\n")}
                      onChange={(e) => handleUpdate(plan.plan, "features", e.target.value.split("\n").filter((f) => f.trim()))}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#3b4cca] focus:outline-none focus:ring-1 focus:ring-[#3b4cca]"
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleSave(plan)}>Save Plan</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
