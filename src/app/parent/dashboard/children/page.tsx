"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { getChildrenProfiles } from "@/lib/services/users";
import { StudentProfile, Service, ServiceRequest } from "@/types";
import { ChildCard } from "@/components/parent/ChildCard";
import { AddChildModal } from "@/components/parent/AddChildModal";
import { ChildDetailsModal } from "@/components/parent/ChildDetailsModal";
import { UserPlus, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const ROLE = "PARENT";

export default function MyChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [childServices, setChildServices] = useState<Record<string, Service[]>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<StudentProfile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const profs = await getChildrenProfiles(user.uid);
        setChildren(profs);

        const map: Record<string, Service[]> = {};
        for (const child of profs) {
          const reqs = await getDocs(collection(db, "serviceRequests"));
          const ids = reqs.docs
            .map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
            .filter((r) => r.studentId === child.uid && r.status === "APPROVED")
            .map((r) => r.serviceId);

          const svcs: Service[] = [];
          for (const sid of ids) {
            const snap = await getDoc(doc(db, "services", sid));
            if (snap.exists()) svcs.push({ id: snap.id, ...snap.data() } as Service);
          }
          map[child.uid] = svcs;
        }
        setChildServices(map);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleChildAdded = (child: StudentProfile) => {
    setChildren((prev) => [...prev, child]);
    setSuccess(`Child ${child.displayName} added successfully!`);
    setTimeout(() => setSuccess(null), 3000);
  };

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
      <DashboardLayout title="My Children">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-[#DC2626]" />
                My Children ({children.length})
              </h2>
              <p className="text-sm text-slate-600">
                View child profile details, live school transport status, and booked services.
              </p>
            </div>
            <Button onClick={() => setIsAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> + Add Child
            </Button>
          </div>

          {success && <Alert variant="success">{success}</Alert>}

          {children.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center bg-white">
              <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900">No Children Linked Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto my-3">
                Create child profiles using child name or link using student ID codes. No child email is required.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Child
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {children.map((child) => (
                <ChildCard
                  key={child.uid}
                  child={child}
                  hasTransport={true}
                  busRoute="Route R-12"
                  pickupTime="7:20 AM"
                  pickupLocation="Bistupur"
                  onViewChild={(c) => {
                    setSelectedChild(c);
                    setIsDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          <AddChildModal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            parentId={user?.uid || ""}
            parentCity={user?.city || "Jamshedpur"}
            onChildAdded={handleChildAdded}
          />

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

