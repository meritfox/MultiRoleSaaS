"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import {
  recordCheckIn,
  getCheckInsByProvider,
  notifyParentOfCheckIn,
  TransportCheckIn,
} from "@/lib/services/transport";
import { getRequestsByProvider } from "@/lib/services/services";
import { MapPin, CheckCircle, Clock, User } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

interface RosterStudent {
  studentId: string;
  studentName: string;
  serviceName: string;
}

export default function ProviderCheckInPage() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [checkInHistory, requests] = await Promise.all([
          getCheckInsByProvider(user.uid),
          getRequestsByProvider(user.uid),
        ]);
        setCheckIns(checkInHistory);
        // Roster = students with an approved request for this provider.
        const approved = requests.filter((r) => r.status === "APPROVED" && r.studentId);
        const unique = new Map<string, RosterStudent>();
        for (const r of approved) {
          if (!unique.has(r.studentId)) {
            unique.set(r.studentId, {
              studentId: r.studentId,
              studentName: (r.student as { displayName?: string } | undefined)?.displayName ?? r.studentId,
              serviceName: r.service?.name ?? "Service",
            });
          }
        }
        setRoster(Array.from(unique.values()));
      } catch (err) {
        console.error(err);
        setError("Failed to load check-in data.");
      } finally {
        setLoading(false);
      }
    };

    // Defer so synchronous setLoading inside load() runs after effect body.
    queueMicrotask(() => {
      void load();
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!studentId) {
      setError("Please select a student. Check-in is recorded for each individual student.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let location: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          location = undefined;
        }
      }

      const record = await recordCheckIn(user.uid, { studentId, type, note, location });
      setCheckIns([record, ...checkIns]);
      // Notify the student's parent of the individual pickup/drop.
      await notifyParentOfCheckIn(record).catch(() => undefined);
      setSuccess(true);
      setNote("");
      setStudentId("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to record check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title="GPS Check-in">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Student Check-in / Check-out
          </h2>
          <p className="text-sm text-slate-500">
            Check-in and check-out are recorded for each individual student.
          </p>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">Check-in recorded successfully!</Alert>}

          <Card title="Record Individual Check-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <div className="flex gap-2">
                    <Button type="button" variant={type === "CHECK_IN" ? "primary" : "outline"} onClick={() => setType("CHECK_IN")} className="flex-1">
                      Check In
                    </Button>
                    <Button type="button" variant={type === "CHECK_OUT" ? "primary" : "outline"} onClick={() => setType("CHECK_OUT")} className="flex-1">
                      Check Out
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Student (required)</label>
                  <select
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                  >
                    <option value="">-- Select student --</option>
                    {roster.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.studentName} ({s.serviceName})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400">
                    Students with approved transport requests appear here.
                  </p>
                </div>
              </div>
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Reached school safely"
              />
              <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!studentId}>
                <MapPin className="mr-2 h-4 w-4" /> Record with Current Location
              </Button>
            </form>
          </Card>

          <Card title="Recent Individual Check-ins">
            {checkIns.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No check-ins recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((ci) => {
                  const student = roster.find((s) => s.studentId === ci.studentId);
                  return (
                    <div key={ci.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70">
                      <div className={`p-2 rounded-lg ${ci.type === "CHECK_IN" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                        {ci.type === "CHECK_IN" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{ci.type.replace("_", " ")}</p>
                        {ci.studentId && (
                          <p className="text-xs text-slate-500">
                            Student: {student?.studentName ?? ci.studentId}
                          </p>
                        )}
                        {ci.note && <p className="text-xs text-slate-500">{ci.note}</p>}
                        {ci.location && (
                          <p className="text-xs text-slate-400">
                            Lat: {ci.location.lat.toFixed(4)}, Lng: {ci.location.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{new Date(ci.timestamp).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
