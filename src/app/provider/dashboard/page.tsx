"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { ServiceRequest, Service, UserProfile, ServiceProviderProfile } from "@/types";
import { Briefcase, Users, Star, IndianRupee, Bus, BookOpen, CheckCircle, XCircle, Clock, MapPin, TrendingUp, Calendar, Wallet } from "lucide-react";
import { getEscrowByProvider } from "@/lib/services/payments";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalServices: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalEarnings: 0,
  });
  const [requests, setRequests] = useState<(ServiceRequest & { service?: Service; student?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasedEarnings, setReleasedEarnings] = useState(0);
  const [heldEarnings, setHeldEarnings] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const servicesRef = collection(db, "services");
        const servicesSnap = await getDocs(query(servicesRef, where("providerId", "==", user.uid)));
        const servicesData = servicesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];

        const requestsRef = collection(db, "serviceRequests");
        const requestsSnap = await getDocs(query(requestsRef, where("providerId", "==", user.uid)));
        const requestsData = requestsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceRequest[];

        const pendingRequests = requestsData.filter((r) => r.status === "PENDING").length;
        const approvedRequests = requestsData.filter((r) => r.status === "APPROVED");

        const approvedServiceIds = approvedRequests.map((r) => r.serviceId);
        const serviceEarnings = servicesData
          .filter((s) => approvedServiceIds.includes(s.id))
          .reduce((sum, s) => sum + s.price, 0);

        // Real escrow earnings for this provider
        const escrowTxs = await getEscrowByProvider(user.uid);
        const released = escrowTxs
          .filter((t) => t.status === "RELEASED")
          .reduce((sum, t) => sum + (t.amount - t.commission), 0);
        const held = escrowTxs
          .filter((t) => t.status === "HELD")
          .reduce((sum, t) => sum + (t.amount - t.commission), 0);

        setReleasedEarnings(released);
        setHeldEarnings(held);

        setStats({
          totalServices: servicesData.length,
          pendingRequests,
          approvedRequests: approvedRequests.length,
          totalEarnings: serviceEarnings + released,
        });

        // Enrich requests with service and student data
        const enrichedRequests = await Promise.all(
          requestsData.slice(0, 5).map(async (req) => {
            const serviceDoc = await getDoc(doc(db, "services", req.serviceId));
            const studentDoc = await getDoc(doc(db, "users", req.studentId));
            return {
              ...req,
              service: serviceDoc.exists() ? ({ id: serviceDoc.id, ...serviceDoc.data() } as Service) : undefined,
              student: studentDoc.exists() ? (studentDoc.data() as UserProfile) : undefined,
            };
          })
        );
        setRequests(enrichedRequests);
      } catch (err) {
        console.error("Error fetching provider stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handleRequestAction = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateDoc(doc(db, "serviceRequests", requestId), {
        status,
        updatedAt: Date.now(),
      });
      setRequests(requests.map((r) => (r.id === requestId ? { ...r, status } : r)));
      if (status === "APPROVED") {
        setStats((prev) => ({ ...prev, pendingRequests: Math.max(0, prev.pendingRequests - 1), approvedRequests: prev.approvedRequests + 1 }));
      } else {
        setStats((prev) => ({ ...prev, pendingRequests: Math.max(0, prev.pendingRequests - 1) }));
      }
    } catch (err) {
      console.error("Error updating request:", err);
    }
  };

  const isTransporter = (user as ServiceProviderProfile | null)?.providerType === "TRANSPORTER";

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title={isTransporter ? "Transporter Dashboard" : "Teacher Dashboard"}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.displayName}!</h2>
              <p className="text-slate-600">
                {isTransporter ? "Manage your fleet, routes, and student check-ins." : "Manage your services and student requests."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/provider/dashboard/profile">Edit Profile</Link>
              </Button>
              {isTransporter && (
                <Button asChild variant="success">
                  <Link href="/provider/dashboard/checkin">GPS Check-in</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 text-[#3b4cca]">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">My Services</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalServices}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingRequests}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Approved</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.approvedRequests}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <IndianRupee className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Earnings</p>
                  <p className="text-2xl font-bold text-slate-900">₹{stats.totalEarnings}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card title="Recent Requests" description="Review and manage student service requests">
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-slate-500">No requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#3b4cca]/10 flex items-center justify-center text-[#3b4cca] font-medium">
                            {request.student?.displayName?.charAt(0) || <Users className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{request.student?.displayName || "Unknown Student"}</p>
                            <p className="text-sm text-slate-500">{request.service?.name || "Unknown Service"}</p>
                            <p className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {request.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestAction(request.id, "REJECTED")}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                              <Button size="sm" onClick={() => handleRequestAction(request.id, "APPROVED")}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                              </Button>
                            </>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {request.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {isTransporter && (
                <Card title="Today's Route" description="Live route and check-in status">
                  <div className="relative h-48 bg-slate-100 rounded-xl overflow-hidden mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-10 w-10 text-[#3b4cca] mx-auto mb-2" />
                        <p className="text-slate-600 font-medium">Route Map View</p>
                        <p className="text-sm text-slate-500">Guwahati - School Bus #15</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-2xl font-bold text-emerald-600">12</p>
                      <p className="text-xs text-slate-600">Students</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                      <p className="text-2xl font-bold text-[#3b4cca]">8</p>
                      <p className="text-xs text-slate-600">Checked In</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                      <p className="text-2xl font-bold text-amber-600">4</p>
                      <p className="text-xs text-slate-600">Pending</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card title="Quick Actions">
                <div className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link href="/provider/dashboard/services">
                      <Briefcase className="mr-2 h-4 w-4" /> Manage Services
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/provider/dashboard/requests">
                      <Users className="mr-2 h-4 w-4" /> View All Requests
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/provider/dashboard/earnings">
                      <TrendingUp className="mr-2 h-4 w-4" /> Earnings Report
                    </Link>
                  </Button>
                  {isTransporter && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/provider/dashboard/checkin">
                        <MapPin className="mr-2 h-4 w-4" /> GPS Check-in
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>

              <Card title="Earnings Overview">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Released Earnings</span>
                      <span className="font-medium text-slate-900">₹{releasedEarnings}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((releasedEarnings / (releasedEarnings + heldEarnings + 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Held in Escrow</span>
                      <span className="font-medium text-slate-900">₹{heldEarnings}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min((heldEarnings / (releasedEarnings + heldEarnings + 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/provider/dashboard/earnings">
                        <Wallet className="mr-2 h-4 w-4" /> View Earnings
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Performance">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Rating</span>
                      <span className="font-medium text-slate-900">{(user as any)?.rating || 0}/5.0</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(((user as any)?.rating || 0) / 5 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Response Rate</span>
                      <span className="font-medium text-slate-900">{stats.pendingRequests === 0 ? 100 : Math.round((stats.approvedRequests / (stats.approvedRequests + stats.pendingRequests)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#3b4cca] rounded-full" style={{ width: `${stats.pendingRequests === 0 ? 100 : Math.round((stats.approvedRequests / (stats.approvedRequests + stats.pendingRequests)) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
