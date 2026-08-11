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
import { recordCheckIn, getCheckInsByProvider, TransportCheckIn } from "@/lib/services/transport";
import { MapPin, CheckCircle, Clock, User } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderCheckInPage() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getCheckInsByProvider(user.uid)
      .then(setCheckIns)
      .catch((err) => {
        console.error(err);
        setError("Failed to load check-in history.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let location: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }

      const record = await recordCheckIn(user.uid, { studentId: studentId || undefined, type, note, location });
      setCheckIns([record, ...checkIns]);
      setSuccess(true);
      setNote("");
      setStudentId("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to record check-in. Please allow location access or try again.");
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
          <h2 className="text-2xl font-bold text-slate-900">Transport Check-in / Check-out</h2>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">Check-in recorded successfully!</Alert>}

          <Card title="Record New Check-in">
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
                <Input
                  label="Student ID (optional)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Student user ID"
                  icon={<User className="h-4 w-4" />}
                />
              </div>
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Reached school safely"
              />
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <MapPin className="mr-2 h-4 w-4" /> Record with Current Location
              </Button>
              <p className="text-xs text-slate-500">Location data is captured from your device GPS when available.</p>
            </form>
          </Card>

          <Card title="Recent Check-ins">
            {checkIns.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No check-ins recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((ci) => (
                  <div key={ci.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className={`p-2 rounded-lg ${ci.type === "CHECK_IN" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {ci.type === "CHECK_IN" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{ci.type.replace("_", " ")}</p>
                      {ci.studentId && <p className="text-xs text-slate-500">Student: {ci.studentId}</p>}
                      {ci.note && <p className="text-xs text-slate-500">{ci.note}</p>}
                      {ci.location && (
                        <p className="text-xs text-slate-400">
                          Lat: {ci.location.lat.toFixed(4)}, Lng: {ci.location.lng.toFixed(4)}
                        </p>
                      )}
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
