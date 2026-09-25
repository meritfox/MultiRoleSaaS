"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { getChildrenProfiles } from "@/lib/services/users";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentProfile, Service, ServiceRequest } from "@/types";
import { Bus, Clock } from "lucide-react";

const PARENT_ROLE = "PARENT";

export default function ParentServicesPage() {
  const { user } = useAuth();
  const [childServices, setChildServices] = useState<{ child: StudentProfile; services: Service[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const children = await getChildrenProfiles(user.uid);
      const result: { child: StudentProfile; services: Service[] }[] = [];
      for (const child of children) {
        const requestsSnap = await getDocs(collection(db, "serviceRequests"));
        const serviceIds = requestsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
          .filter((r) => r.studentId === child.uid && r.status === "APPROVED")
          .map((r) => r.serviceId);
        const services: Service[] = [];
        for (const sid of serviceIds) {
          const snap = await getDoc(doc(collection(db, "services"), sid));
          if (snap.exists()) services.push({ id: snap.id, ...snap.data() } as Service);
        }
        result.push({ child, services });
      }
      setChildServices(result);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <ProtectedRoute allowedRoles={[PARENT_ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;

  return (
    <ProtectedRoute allowedRoles={[PARENT_ROLE]}>
      <DashboardLayout title="My Services">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Services</h2>
            <p className="text-sm text-slate-600">
              Overview of School Transport, Math & Science Tutors, Coaching, and Booked Activities.
            </p>
          </div>

          {/* Service Samples if none yet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">School Transport</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Active</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">SafeRide Transport</h4>
              <p className="text-xs text-slate-500 mt-1">Bus Route R-12 · DAV Public School</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Pick: 7:20 AM · Drop: 1:50 PM</span>
                <span className="font-bold text-slate-900">₹3,500/mo</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">Tutoring & Coaching</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Active</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Math & Science Tutor</h4>
              <p className="text-xs text-slate-500 mt-1">Rahul Sharma · 3 classes / week</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Tue, Thu, Sat · 5:00 PM</span>
                <span className="font-bold text-slate-900">₹2,500/mo</span>
              </div>
            </div>
          </div>

          {childServices.map(({ child, services }) => (
            <Card key={child.uid} title={`${child.displayName}'s Booked Services`}>
              {services.length === 0 ? (
                <p className="text-slate-500 text-sm">No additional services linked directly to student ID.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${s.providerType === "TRANSPORTER" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-[#DC2626]"}`}>
                          {s.providerType === "TRANSPORTER" ? <Bus className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{s.providerType} · ₹{s.price}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
