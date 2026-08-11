"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";

const ROLE = "PARENT";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="Live Map">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Live Map</h2>
          <Card>
            <p className="text-slate-600">Interactive live map integration is coming soon. Use the dashboard check-in feed for now.</p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
