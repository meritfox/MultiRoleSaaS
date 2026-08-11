"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";

const ROLE = "SUPER_ADMIN";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="System Reports">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">System Reports</h2>
          <Card>
            <p className="text-slate-600">Advanced system reports are coming soon.</p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
