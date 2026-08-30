"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestsByStudent } from "@/lib/services/services";
import { ServiceRequest } from "@/types";
import { requestStatusVariant, formatShortDate } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, ClipboardList } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

type RequestWithService = ServiceRequest & {
  service?: { name: string; price: number; providerType: string };
};

const STATUS_ICONS = {
  PENDING: <Clock className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
} as const;

export default function StudentRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithService[]>([]);
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
        <div className="max-w-5xl mx-auto space-y-6">
          <PageHeader
            title="My Requests"
            description="Track the status of every service request you have made."
          />

          {requests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No requests yet"
              description="Browse services and hit Request Service to get started."
              actionLabel="Browse services"
              actionHref="/student/dashboard"
            />
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-500">
                      {STATUS_ICONS[r.status]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {r.service?.name || "Unknown Service"}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {r.service?.providerType || "Service"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Requested {formatShortDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={requestStatusVariant(r.status)} dot>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}