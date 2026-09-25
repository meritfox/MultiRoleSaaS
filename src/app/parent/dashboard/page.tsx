"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { StudentProfile, Service, ServiceRequest, Notification } from "@/types";
import { getChildrenProfiles } from "@/lib/services/users";
import { getNotifications, markNotificationRead, subscribeToNotifications } from "@/lib/services/services";
import { getCheckInsByStudent, TransportCheckIn } from "@/lib/services/transport";
import { ChildCard } from "@/components/parent/ChildCard";
import { AddChildModal } from "@/components/parent/AddChildModal";
import { ChildDetailsModal } from "@/components/parent/ChildDetailsModal";
import { TransportDemandWidget } from "@/components/parent/TransportDemandWidget";
import {
  UserPlus,
  Bus,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  Clock3,
  AlertTriangle,
  Compass,
} from "lucide-react";

const PARENT_ROLE = "PARENT" as const;

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [childServices, setChildServices] = useState<Record<string, Service[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);

  // Modals state
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<StudentProfile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const childrenProfiles = await getChildrenProfiles(user.uid);
        setChildren(childrenProfiles);

        const servicesMap: Record<string, Service[]> = {};
        const allCheckIns: TransportCheckIn[] = [];
        for (const child of childrenProfiles) {
          const requestsSnap = await getDocs(collection(db, "serviceRequests"));
          const serviceIds = requestsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
            .filter((r) => r.studentId === child.uid && r.status === "APPROVED")
            .map((r) => r.serviceId);

          const services: Service[] = [];
          for (const serviceId of serviceIds) {
            const serviceDoc = await getDoc(doc(db, "services", serviceId));
            if (serviceDoc.exists()) {
              services.push({ id: serviceDoc.id, ...serviceDoc.data() } as Service);
            }
          }
          servicesMap[child.uid] = services;

          const childCheckIns = await getCheckInsByStudent(child.uid);
          allCheckIns.push(...childCheckIns);
        }
        setChildServices(servicesMap);
        setCheckIns(allCheckIns.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10));

        const notifs = await getNotifications(user.uid);
        setNotifications(notifs);
      } catch (err) {
        console.error("Error fetching children:", err);
        setError("Failed to load family dashboard information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsub = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsub();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewChild = (child: StudentProfile) => {
    setSelectedChild(child);
    setIsDetailsOpen(true);
  };
  const handleChildAdded = (child: StudentProfile) => {
    setChildren((prev) => [...prev, child]);
    setSuccess(`Child ${child.displayName} added successfully!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const hasAnyChildTransport = children.length > 0;
  const primaryChild = children[0];
  const parentName = user?.displayName ? user.displayName.split(" ")[0] : "Parent";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PARENT_ROLE]}>
      <DashboardLayout title="Parent Dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Good morning, {parentName} 👋
              </h2>
              <p className="text-slate-600 text-sm">
                Here&apos;s what&apos;s happening with your family today.
              </p>
            </div>
            <Button onClick={() => setIsAddChildOpen(true)} className="shadow-soft">
              <UserPlus className="h-4 w-4 mr-2" /> Add Child
            </Button>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Section: My Children Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-lg">My Children</h3>
              <span className="text-xs text-slate-500 font-medium">{children.length} linked</span>
            </div>

            {children.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center bg-white shadow-soft">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mb-3">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">No children linked yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Add your child using their name or school ID code (no child email required) to track transportation and avail learning services.
                </p>
                <Button onClick={() => setIsAddChildOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add Your Child
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child) => (
                  <ChildCard
                    key={child.uid}
                    child={child}
                    hasTransport={true}
                    busRoute="Route R-12"
                    pickupTime="7:20 AM"
                    pickupLocation="Bistupur"
                    onViewChild={handleViewChild}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setIsAddChildOpen(true)}
                  className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#DC2626] hover:bg-red-50/20 transition-all p-6 flex flex-col items-center justify-center text-slate-500 hover:text-[#DC2626] min-h-[160px]"
                >
                  <UserPlus className="h-7 w-7 mb-2" />
                  <span className="text-sm font-bold">+ Add Another Child</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Transport Today & Demands */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card title="Transport Today" description="Live school route, driver contacts, and active transit status">
                {hasAnyChildTransport ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/60 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-soft">
                          <Bus className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">
                              🚍 {primaryChild?.displayName || "Aarav"}&apos;s Bus
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              On Route
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                            <div>
                              <span className="text-slate-400 block text-[10px]">ROUTE</span>
                              <span className="font-semibold text-slate-800">R-12</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">DRIVER</span>
                              <span className="font-semibold text-slate-800">Rajesh Kumar</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">PICKUP TIME</span>
                              <span className="font-semibold text-slate-800">7:20 AM</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button asChild size="sm">
                        <Link href="/parent/dashboard/live-map">
                          <MapPin className="h-4 w-4 mr-1.5" /> Live Track
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bus className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-900">Your child currently has no transport</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto my-2">
                      12 transport options and verified OmniStud routes may be available near your area.
                    </p>
                    <Button asChild size="sm">
                      <Link href="/parent/dashboard/transport">
                        <Compass className="h-4 w-4 mr-1.5" /> Find Transport
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>

              <TransportDemandWidget
                schoolName={primaryChild?.school || "DAV Public School"}
                cityArea={user?.city || "Bistupur"}
                childrenLookingCount={8}
                operatorCount={3}
              />
            </div>

            {/* Right Column: Notifications & Alerts */}
            <div className="space-y-6">
              <Card title="Notifications & Alerts">
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                          n.read ? "bg-slate-50/70 border-slate-100 opacity-70" : "bg-red-50/40 border-red-100"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === "SUCCESS" && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
                          {n.type === "WARNING" && <Clock3 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                          {n.type === "ALERT" && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                          {n.type === "INFO" && <Bell className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 leading-tight">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </Card>

              {/* Quick Links Card */}
              <Card title="My Services Summary">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-600">School Transport</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">SafeRide (Active)</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-600">Math Tutoring</span>
                    <span className="font-semibold text-slate-800">3 classes / week</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2 text-xs">
                    <Link href="/parent/dashboard/services">
                      Manage My Services
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Add Child Modal */}
          <AddChildModal
            isOpen={isAddChildOpen}
            onClose={() => setIsAddChildOpen(false)}
            parentId={user?.uid || ""}
            parentCity={user?.city || "Jamshedpur"}
            onChildAdded={handleChildAdded}
          />

          {/* Child Details Modal */}
          <ChildDetailsModal
            child={selectedChild}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            services={selectedChild ? (childServices[selectedChild.uid] || []) : []}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

