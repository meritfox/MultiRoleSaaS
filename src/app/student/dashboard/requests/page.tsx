"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { getRequestsByStudent } from "@/lib/services/services";
import { ServiceRequest } from "@/types";
import { Clock, CheckCircle, XCircle, BookOpen } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

export default function StudentRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(ServiceRequest & { service?: { name: string; price: number; providerType: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getRequestsByStudent(user.uid)
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="My Requests">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">My Service Requests</h2>

          <Card title="Request History">
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">No service requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${r.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" : r.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                        {r.status === "APPROVED" ? <CheckCircle className="h-4 w-4" /> : r.status === "REJECTED" ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{r.service?.name || "Unknown Service"}</p>
                        <p className="text-xs text-slate-500 capitalize">{r.service?.providerType || "Service"} • ₹{r.service?.price || 0}</p>
                        <p className="text-xs text-slate-400">Requested {new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.status}
                    </span>
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
