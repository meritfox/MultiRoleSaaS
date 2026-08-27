"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import TransportMap, { MapMarker } from "@/components/map/TransportMap";
import {
  recordCheckIn,
  getCheckInsByProvider,
  deleteCheckIn,
  updateLiveLocation,
  stopLiveLocation,
  notifyParentOfCheckIn,
  TransportCheckIn,
} from "@/lib/services/transport";
import { getRequestsByProvider } from "@/lib/services/services";
import { Play, Square, CheckCircle, Clock, Trash2, Users } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

// Fallback demo route loop (central Guwahati) used when device GPS is
// unavailable - keeps the live-tracking demo working from any desktop.
const SIMULATED_ROUTE = [
  { lat: 26.1445, lng: 91.7362 },
  { lat: 26.1475, lng: 91.7405 },
  { lat: 26.1515, lng: 91.7445 },
  { lat: 26.156, lng: 91.7485 },
  { lat: 26.1605, lng: 91.7515 },
  { lat: 26.164, lng: 91.7475 },
  { lat: 26.167, lng: 91.742 },
  { lat: 26.163, lng: 91.7375 },
  { lat: 26.1585, lng: 91.7335 },
  { lat: 26.152, lng: 91.7315 },
];

interface AssignedStudent {
  studentId: string;
  name: string;
}

type GeoPoint = { lat: number; lng: number };

export default function TransportConsolePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);
  const [tripActive, setTripActive] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [current, setCurrent] = useState<GeoPoint | null>(null);
  const [trail, setTrail] = useState<GeoPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const simIndexRef = useRef(0);

  // Load approved (assigned) students + check-in history.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const reqs = await getRequestsByProvider(user.uid);
        const approved = reqs.filter((r) => r.status === "APPROVED");
        const seen = new Set<string>();
        const unique: AssignedStudent[] = [];
        for (const r of approved) {
          if (seen.has(r.studentId)) continue;
          seen.add(r.studentId);
          unique.push({
            studentId: r.studentId,
            name: r.student?.displayName || `Student ${r.studentId.slice(0, 6)}`,
          });
        }
        if (!cancelled) setStudents(unique);

        const history = await getCheckInsByProvider(user.uid);
        if (!cancelled) setCheckIns(history);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load transport data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Push a position to state, the map trail and the live-location doc.
  const recordPosition = (pos: GeoPoint, accuracy?: number) => {
    setCurrent(pos);
    setTrail((prev) => [...prev.slice(-199), pos]);
    if (user) {
      updateLiveLocation(user.uid, { ...pos, accuracy }).catch((err) =>
        console.warn("Live location update failed:", err)
      );
    }
  };

  const startSimulation = () => {
    const tick = () => {
      const point = SIMULATED_ROUTE[simIndexRef.current % SIMULATED_ROUTE.length];
      simIndexRef.current += 1;
      recordPosition(point);
    };
    tick();
    simIntervalRef.current = window.setInterval(tick, 2000);
    setSimulating(true);
    setTripActive(true);
  };

  const startTrip = () => {
    setError(null);
    if (navigator.geolocation) {
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      simIndexRef.current = 0;
      setTrail([]);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) =>
          recordPosition(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            pos.coords.accuracy
          ),
        (err) => {
          console.warn("GPS error, falling back to simulated route:", err);
          setError("GPS unavailable - running a simulated route instead.");
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          startSimulation();
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      setSimulating(false);
      setTripActive(true);
    } else {
      setError("GPS unavailable - running a simulated route instead.");
      startSimulation();
    }
  };

  const stopTrip = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current !== null) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setTripActive(false);
    setSimulating(false);
    if (user) {
      stopLiveLocation(user.uid).catch((err) => console.warn("Stop live location failed:", err));
    }
  };

  // Always stop the trip (and live location) when leaving the page.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      if (user) {
        stopLiveLocation(user.uid).catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Record a pickup (CHECK_IN) or drop (CHECK_OUT) for a student and alert
  // the parent via a notification.
  const handleStudentAction = async (
    student: AssignedStudent,
    type: "CHECK_IN" | "CHECK_OUT"
  ) => {
    if (!user) return;
    setActionId(student.studentId + type);
    setError(null);
    try {
      const record = await recordCheckIn(user.uid, {
        studentId: student.studentId,
        type,
        note: `${student.name} ${type === "CHECK_IN" ? "picked up" : "dropped off"}`,
        location: current || undefined,
      });
      await notifyParentOfCheckIn(record);
      setCheckIns((prev) => [record, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to record the check-in.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteCheckIn = async (id: string) => {
    try {
      await deleteCheckIn(id);
      setCheckIns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete the check-in.");
    }
  };

  const studentName = (studentId?: string) =>
    students.find((s) => s.studentId === studentId)?.name || (studentId ? studentId.slice(0, 6) : "");

  // Map markers: live bus position + recent check-in points.
  const markers: MapMarker[] = [];
  if (current) {
    markers.push({
      id: "live-bus",
      lat: current.lat,
      lng: current.lng,
      label: "Current position",
      emoji: "🚌",
    });
  }
  for (const ci of checkIns.slice(0, 20)) {
    if (!ci.location) continue;
    markers.push({
      id: ci.id,
      lat: ci.location.lat,
      lng: ci.location.lng,
      label: `${ci.type === "CHECK_IN" ? "Pickup" : "Drop"}: ${studentName(ci.studentId)}`,
      color: ci.type === "CHECK_IN" ? "#059669" : "#d97706",
    });
  }

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
      <DashboardLayout title="Transport Console">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Transport Console</h2>
            {tripActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE{simulating ? " (simulated)" : ""}
              </span>
            )}
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Card>
            <div className="flex flex-wrap items-center gap-3">
              {tripActive ? (
                <Button onClick={stopTrip} variant="outline">
                  <Square className="mr-2 h-4 w-4" /> Stop Trip
                </Button>
              ) : (
                <Button onClick={startTrip}>
                  <Play className="mr-2 h-4 w-4" /> Start Trip
                </Button>
              )}
              <p className="text-xs text-slate-500">
                Your live GPS position is shared with parents and students while a trip is active.
                If GPS is unavailable, a simulated Guwahati route is used.
              </p>
            </div>
          </Card>

          <Card title="Route Visualisation (OpenStreetMap)">
            <TransportMap markers={markers} route={trail} className="h-96 w-full rounded-xl border border-slate-200/60" />
            <p className="mt-2 text-xs text-slate-400">
              🚌 current position · green dots: pickups · amber dots: drops
            </p>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Assigned Students">
              {students.length === 0 ? (
                <p className="text-center text-slate-500 py-6">
                  No students assigned yet. Approve transport requests to add students.
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((s) => (
                    <div key={s.studentId} className="flex items-center gap-3 rounded-lg border border-slate-200/60 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DC2626]/10 text-[#DC2626]">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="flex-1 min-w-0 font-medium text-slate-900 truncate">{s.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={actionId === s.studentId + "CHECK_IN"}
                        onClick={() => handleStudentAction(s, "CHECK_IN")}
                      >
                        Pickup
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={actionId === s.studentId + "CHECK_OUT"}
                        onClick={() => handleStudentAction(s, "CHECK_OUT")}
                      >
                        Drop
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Recent Check-ins">
              {checkIns.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No check-ins recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
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
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {ci.type === "CHECK_IN" ? "Pickup" : "Drop"}
                          {ci.studentId ? ` - ${studentName(ci.studentId)}` : ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(ci.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCheckIn(ci.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete check-in"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

