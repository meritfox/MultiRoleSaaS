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
      <DashboardLayout title="Tracked Services">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Tracked Services</h2>
          {childServices.map(({ child, services }) => (
            <Card key={child.uid} title={child.displayName}>
              {services.length === 0 ? (
                <p className="text-slate-500">No active services.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${s.providerType === "TRANSPORTER" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-[#3b4cca]"}`}>
                          {s.providerType === "TRANSPORTER" ? <Bus className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{s.providerType}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
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
