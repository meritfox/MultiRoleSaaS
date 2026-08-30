"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateUserProfile } from "@/lib/auth-utils";
import { getInitials } from "@/lib/utils";
import { UserCircle } from "lucide-react";

const ROLE = "STUDENT";

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Adjust the form state when a different user loads (render-time adjustment,
  // avoids the cascading renders of setState inside an effect).
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  if (user && user.uid !== syncedUserId) {
    setSyncedUserId(user.uid);
    setDisplayName(user.displayName || "");
    setPhone(user.phoneNumber || "");
  }

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await updateUserProfile(user.uid, { displayName, phoneNumber: phone });
    await refreshUser();
    setLoading(false);
    alert("Profile updated.");
  };

  if (!user)
    return (
      <ProtectedRoute allowedRoles={[ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="Account">
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader title="Account Settings" description="Your personal details." />

          <Card>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] text-lg font-semibold text-white shadow-soft">
                {getInitials(user.displayName)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{user.displayName}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                icon={<UserCircle className="h-4 w-4" />}
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={handleSave} isLoading={loading} className="w-full">
                Save Profile
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}