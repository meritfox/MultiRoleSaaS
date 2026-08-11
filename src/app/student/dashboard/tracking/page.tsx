"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { getCheckInsByStudent } from "@/lib/services/transport";
import { TransportCheckIn } from "@/lib/services/transport";
import { MapPin, CheckCircle, Clock } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

export default function StudentTrackingPage() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCheckInsByStudent(user.uid).then((data) => {
      setCheckIns(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <ProtectedRoute allowedRoles={[STUDENT_ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="GPS Tracking">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">My Transport Tracking</h2>
          <Card title="Recent Check-ins">
            {checkIns.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No check-ins recorded for you yet.</p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((ci) => (
                  <div key={ci.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className={`p-2 rounded-lg ${ci.type === "CHECK_IN" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {ci.type === "CHECK_IN" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{ci.type.replace("_", " ")}</p>
                      {ci.note && <p className="text-xs text-slate-500">{ci.note}</p>}
                      {ci.location && <p className="text-xs text-slate-400">Lat: {ci.location.lat.toFixed(4)}, Lng: {ci.location.lng.toFixed(4)}</p>}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(ci.timestamp).toLocaleString()}</span>
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
