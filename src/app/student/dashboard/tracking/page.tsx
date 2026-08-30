"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import TransportMap, { MapMarker } from "@/components/map/TransportMap";
import { getRequestsByStudent } from "@/lib/services/services";
import {
  getCheckInsByStudent,
  subscribeToLiveLocation,
  LiveLocation,
  TransportCheckIn,
} from "@/lib/services/transport";
import { CheckCircle, Clock } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

export default function StudentTrackingPage() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);
  const [live, setLive] = useState<LiveLocation | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let unsub: () => void = () => {};

    (async () => {
      try {
        // Resolve my transport provider from approved requests.
        const reqs = await getRequestsByStudent(user.uid);
        const transportReq = reqs.find(
          (r) => r.status === "APPROVED" && r.service?.providerType === "TRANSPORTER"
        );
        const pid = transportReq?.providerId ?? null;
        if (cancelled) return;
        setProviderId(pid);

        if (pid) {
          unsub = subscribeToLiveLocation(pid, (loc) => {
            if (!cancelled) setLive(loc);
          });
        }

        const data = await getCheckInsByStudent(user.uid).catch(() => []);
        if (!cancelled) {
          setCheckIns(data);
        }
      } catch (err) {
        console.warn("Tracking data unavailable:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  const markers: MapMarker[] = [];
  if (live) {
    markers.push({
      id: "live-bus",
      lat: live.lat,
      lng: live.lng,
      label: `Your transport${live.active ? "" : " (offline)"}`,
      emoji: "🚌",
    });
  }
  for (const ci of checkIns.slice(0, 20)) {
    if (!ci.location) continue;
    markers.push({
      id: ci.id,
      lat: ci.location.lat,
      lng: ci.location.lng,
      label: `${ci.type === "CHECK_IN" ? "Pickup" : "Drop"}`,
      color: ci.type === "CHECK_IN" ? "#059669" : "#d97706",
    });
  }

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
      <DashboardLayout title="GPS Tracking">
        <div className="max-w-5xl mx-auto space-y-6">
          <PageHeader
            title="My Transport Tracking"
            description="Live GPS position and check-in history of your linked transport."
            actions={
              providerId &&
              (live?.active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Transport offline
                </span>
              ))
            }
          />

          {providerId ? (
            <Card title="Live Vehicle Location (OpenStreetMap)">
              <TransportMap markers={markers} className="h-96 w-full rounded-xl border border-slate-200/60" />
              <p className="mt-2 text-xs text-slate-400">
                🚌 current position · green dots: pickups · amber dots: drops
              </p>
            </Card>
          ) : (
            <Card>
              <p className="text-center text-slate-500 py-8">
                No active transport service. Request a transport service from the transport page
                to enable live tracking.
              </p>
            </Card>
          )}

          <Card title="My Check-In Status">
            {checkIns.length === 0 ? (
              <p className="text-center text-slate-500 py-4">
                No check-in events recorded for you yet.
              </p>
            ) : (
              (() => {
                const latest = checkIns[0];
                const checkedIn = latest.type === "CHECK_IN";
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        checkedIn ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {checkedIn ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {checkedIn ? "Picked up (Checked In)" : "Dropped off (Checked Out)"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(latest.timestamp).toLocaleString()}
                        {latest.note ? ` — ${latest.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        checkedIn
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {checkedIn ? "ON BOARD" : "COMPLETED"}
                    </span>
                  </div>
                );
              })()
            )}
          </Card>

          <Card title="Pickup / Drop History">
            {checkIns.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No check-ins recorded for you yet.</p>
            ) : (
              <div className="space-y-2">
                {checkIns.map((ci) => (
                  <div key={ci.id} className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3">
                    <div
                      className={`p-2 rounded-lg ${
                        ci.type === "CHECK_IN"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {ci.type === "CHECK_IN" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {ci.type === "CHECK_IN" ? "Pickup" : "Drop"}
                      </p>
                      {ci.note && <p className="text-xs text-slate-500">{ci.note}</p>}
                      {ci.location && (
                        <p className="text-xs text-slate-400">
                          Lat: {ci.location.lat.toFixed(4)}, Lng: {ci.location.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(ci.timestamp).toLocaleString()}
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