"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import TransportMap, { MapMarker } from "@/components/map/TransportMap";
import { getChildrenProfiles } from "@/lib/services/users";
import { getRequestsByStudent } from "@/lib/services/services";
import {
  getCheckInsByStudent,
  subscribeToLiveLocation,
  LiveLocation,
  TransportCheckIn,
} from "@/lib/services/transport";
import { StudentProfile } from "@/types";
import { CheckCircle, Clock } from "lucide-react";

const ROLE = "PARENT";

interface TrackedChild {
  child: StudentProfile;
  providerId?: string;
  checkIns: TransportCheckIn[];
}

export default function ParentLiveMapPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tracked, setTracked] = useState<TrackedChild[]>([]);
  const [liveLocations, setLiveLocations] = useState<Record<string, LiveLocation | null>>({});

  // Resolve each child's transport provider + check-in history.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const children = await getChildrenProfiles(user.uid);
      const results: TrackedChild[] = [];

      for (const child of children) {
        let providerId: string | undefined;
        try {
          const reqs = await getRequestsByStudent(child.uid);
          const transportReq = reqs.find(
            (r) => r.status === "APPROVED" && r.service?.providerType === "TRANSPORTER"
          );
          providerId = transportReq?.providerId;
        } catch (err) {
          console.warn("Could not resolve transport provider for child:", err);
        }

        let checkIns: TransportCheckIn[] = [];
        try {
          checkIns = await getCheckInsByStudent(child.uid);
        } catch (err) {
          console.warn("Could not load check-ins for child:", err);
        }

        results.push({ child, providerId, checkIns });
      }

      if (!cancelled) {
        setTracked(results);
        setLoading(false);
      }
    })().catch((err) => {
      console.error(err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Subscribe to live locations of every resolved transport provider.
  const providerIds = [...new Set(tracked.map((t) => t.providerId).filter(Boolean))] as string[];
  const providerKey = providerIds.sort().join(",");

  useEffect(() => {
    if (providerIds.length === 0) return;
    const unsubs = providerIds.map((pid) =>
      subscribeToLiveLocation(pid, (loc) => {
        setLiveLocations((prev) => ({ ...prev, [pid]: loc }));
      })
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKey]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="Live Map">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Live Transport Map</h2>
            <p className="text-sm text-slate-600">
              Real-time vehicle position (OpenStreetMap) plus pickup/drop check-ins per child.
              Parents are also alerted via notifications on every pickup and drop.
            </p>
          </div>

          {tracked.length === 0 ? (
            <Card>
              <p className="text-center text-slate-500 py-8">
                No children linked yet. Link a child from the Family Overview dashboard.
              </p>
            </Card>
          ) : (
            tracked.map((t) => {
              const live = t.providerId ? liveLocations[t.providerId] : null;
              const markers: MapMarker[] = [];

              if (live) {
                markers.push({
                  id: `live-${t.providerId}`,
                  lat: live.lat,
                  lng: live.lng,
                  label: `${t.child.displayName}'s transport${live.active ? "" : " (offline)"}`,
                  emoji: "🚌",
                });
              }

              for (const ci of t.checkIns.slice(0, 20)) {
                if (!ci.location) continue;
                markers.push({
                  id: ci.id,
                  lat: ci.location.lat,
                  lng: ci.location.lng,
                  label: `${ci.type === "CHECK_IN" ? "Pickup" : "Drop"} - ${new Date(ci.timestamp).toLocaleString()}`,
                  color: ci.type === "CHECK_IN" ? "#059669" : "#d97706",
                });
              }

              return (
                <Card key={t.child.uid}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{t.child.displayName}</h3>
                    {t.providerId ? (
                      live?.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          Transport offline
                        </span>
                      )
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        No transport service
                      </span>
                    )}
                  </div>

                  {t.providerId ? (
                    <TransportMap
                      markers={markers}
                      className="h-80 w-full rounded-xl border border-slate-200/60"
                    />
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      Request a transport service from the marketplace to enable live tracking.
                    </p>
                  )}

                  <h4 className="font-medium text-slate-900 mt-4 mb-2">Pickup / Drop alerts</h4>
                  {t.checkIns.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">No check-ins recorded for this child yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {t.checkIns.map((ci) => (
                        <div key={ci.id} className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-2.5">
                          <div
                            className={`p-1.5 rounded-lg ${
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
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {ci.type === "CHECK_IN" ? "Pickup" : "Drop"}
                            </p>
                            {ci.note && <p className="text-xs text-slate-500">{ci.note}</p>}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(ci.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

