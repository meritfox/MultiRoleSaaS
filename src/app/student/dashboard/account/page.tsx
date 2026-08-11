"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { updateUserProfile } from "@/lib/auth-utils";
import { UserCircle } from "lucide-react";

const ROLE = "STUDENT";

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhone(user.phoneNumber || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await updateUserProfile(user.uid, { displayName, phoneNumber: phone });
    await refreshUser();
    setLoading(false);
    alert("Profile updated.");
  };

  if (!user) return <ProtectedRoute allowedRoles={[ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;

  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="Account">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
          <Card>
            <div className="space-y-4">
              <Input label="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} icon={<UserCircle className="h-4 w-4" />} />
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button onClick={handleSave} isLoading={loading} className="w-full">Save Profile</Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
