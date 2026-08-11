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
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { StudentProfile, Service, ServiceRequest, UserProfile, Notification } from "@/types";
import { getChildrenProfiles, linkChildToParent } from "@/lib/services/users";
import { getNotifications, markNotificationRead, subscribeToNotifications } from "@/lib/services/services";
import { getCheckInsByStudent, TransportCheckIn } from "@/lib/services/transport";
import { UserPlus, User, Bus, Bell, MapPin, CreditCard, Clock, AlertTriangle, CheckCircle, XCircle, Clock3 } from "lucide-react";

const PARENT_ROLE = "PARENT" as const;

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [childEmail, setChildEmail] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [childServices, setChildServices] = useState<Record<string, Service[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [checkIns, setCheckIns] = useState<TransportCheckIn[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const childrenProfiles = await getChildrenProfiles(user.uid);
        setChildren(childrenProfiles);

        // Fetch approved services per child
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
        setError("Failed to load children information.");
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

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !childEmail.trim()) return;

    setIsLinking(true);
    setError(null);
    setSuccess(null);

    try {
      const child = await linkChildToParent(user.uid, childEmail.trim());
      if (!child) {
        setError("No student found with this email.");
        setIsLinking(false);
        return;
      }
      setChildren([...children, child]);
      setChildEmail("");
      setSuccess("Child linked successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error linking child:", err);
      setError("Failed to link child. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

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
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Parent Dashboard: {user?.displayName}'s Family Overview</h2>
            <p className="text-slate-600">Monitor your children, services, and live tracking.</p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Family Members */}
              <Card title="Family Members">
                <div className="space-y-3">
                  {children.map((child) => (
                    <div key={child.uid} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="h-10 w-10 rounded-full bg-[#3b4cca]/10 flex items-center justify-center text-[#3b4cca] font-medium">
                        {child.displayName?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{child.displayName}</p>
                        <p className="text-xs text-slate-500">{child.grade || "Student"} â€¢ {child.school || "Guwahati Prep School"}</p>
                      </div>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No children linked yet.</p>
                  )}
                </div>
              </Card>

              {/* Link Child */}
              <Card title="Link a Child">
                <form onSubmit={handleLinkChild} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter child's email address"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                    icon={<User className="h-4 w-4" />}
                  />
                  <Button type="submit" isLoading={isLinking} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> Link Child
                  </Button>
                </form>
              </Card>

              {/* Upcoming Payments */}
              <Card title="My Subscription">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="font-medium text-slate-900">Current Plan</p>
                    <p className="text-[#3b4cca] font-bold">{user?.subscriptionPlan || "BASIC"}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.subscriptionBilling || "MONTHLY"} Billing</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Payment Status</span>
                      <span className={`font-medium ${user?.paymentStatus === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}`}>{user?.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Active Children</span>
                      <span className="font-medium">{children.length}</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Tracked Services</span>
                      <span className="font-medium">{Object.values(childServices).flat().length}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Middle Column */}
            <div className="space-y-6 xl:col-span-2">
              {/* Linked Children & Notifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="My Linked Children">
                  <div className="grid grid-cols-2 gap-3">
                    {children.map((child) => (
                      <div key={child.uid} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-medium text-slate-900 text-sm">{child.displayName}</p>
                        <p className="text-xs text-slate-500">{child.grade || "Grade 5"}</p>
                        <p className="text-xs text-slate-500">{child.school || "Guwahati Prep"}</p>
                        <Button size="sm" variant="outline" className="mt-2 w-full text-xs">Services</Button>
                      </div>
                    ))}
                    <button className="p-3 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:border-[#3b4cca] hover:text-[#3b4cca] transition-colors min-h-[120px]">
                      <UserPlus className="h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">Add Child</span>
                    </button>
                  </div>
                </Card>

                <Card title="Notifications & Alerts">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No notifications yet.</p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleMarkRead(notification.id)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${notification.read ? "bg-slate-50 opacity-70" : "bg-blue-50"}`}
                        >
                          {notification.type === "SUCCESS" && <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                          {notification.type === "WARNING" && <Clock3 className="h-5 w-5 text-amber-500 flex-shrink-0" />}
                          {notification.type === "ALERT" && <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                          {notification.type === "INFO" && <Bell className="h-5 w-5 text-[#3b4cca] flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                            <p className="text-sm font-bold text-slate-800">{notification.title}</p>
                            <p className="text-sm text-slate-700">{notification.message}</p>
                          </div>
                          {!notification.read && <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></span>}
                        </button>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Tracked Services */}
              <Card title="Tracked Services Summary">
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">All active services across all children.</p>
                  {Object.entries(childServices).map(([childId, services]) =>
                    services.map((service) => (
                      <div key={`${childId}-${service.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${service.providerType === "TRANSPORTER" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-[#3b4cca]"}`}>
                            {service.providerType === "TRANSPORTER" ? <Bus className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{service.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{service.providerType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                          <Button size="sm" variant="ghost" className="text-xs ml-2">Manage</Button>
                        </div>
                      </div>
                    ))
                  )}
                  {Object.values(childServices).flat().length === 0 && (
                    <p className="text-sm text-slate-500 italic">No active services tracked.</p>
                  )}
                </div>
              </Card>

              {/* Live Check-in Feed */}
              <Card title="Live Transportation Check-ins">
                <div className="space-y-3">
                  {checkIns.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No recent check-ins from linked children.</p>
                    </div>
                  ) : (
                    checkIns.slice(0, 5).map((ci) => (
                      <div key={ci.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <div className={`p-2 rounded-lg ${ci.type === "CHECK_IN" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{ci.type.replace("_", " ")}</p>
                          <p className="text-xs text-slate-500">Student: {ci.studentId}</p>
                          {ci.note && <p className="text-xs text-slate-500">{ci.note}</p>}
                          {ci.location && (
                            <p className="text-xs text-slate-400">
                              Location: {ci.location.lat.toFixed(4)}, {ci.location.lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(ci.timestamp).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

