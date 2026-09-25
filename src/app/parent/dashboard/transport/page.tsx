"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getTransportRequirementsByParent } from "@/lib/services/transport";
import { getAllServices } from "@/lib/services/services";
import { TransportRequirement, Service } from "@/types";
import { Bus, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";

const ROLE = "PARENT";

export default function SchoolTransportPage() {
  const { user } = useAuth();
  const [demands, setDemands] = useState<TransportRequirement[]>([]);
  const [transporters, setTransporters] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const [reqs, svcs] = await Promise.all([
          getTransportRequirementsByParent(user.uid),
          getAllServices(),
        ]);
        setDemands(reqs);
        setTransporters(svcs.filter((s) => s.providerType === "TRANSPORTER"));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

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
      <DashboardLayout title="School Transport">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Bus className="h-6 w-6 text-amber-600" />
                School Transportation
              </h2>
              <p className="text-sm text-slate-600">
                Live GPS tracking, transport demands, and verified school transporters.
              </p>
            </div>
            <Button asChild>
              <Link href="/parent/dashboard/live-map">
                <MapPin className="h-4 w-4 mr-1.5" /> Open Live GPS Map
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">My Transport Requirements & Demands</h3>
            {demands.length === 0 ? (
              <Card>
                <div className="text-center py-6">
                  <Bus className="h-9 w-9 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-800">No active transport requirements created</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demands.map((d) => (
                  <div key={d.id} className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{d.childName}</h4>
                        <p className="text-xs text-slate-600">School: {d.schoolName}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {d.status}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-700 bg-white/70 p-3 rounded-xl border border-slate-100">
                      <p><span className="font-semibold">Pickup:</span> {d.pickupLocation}</p>
                      <p><span className="font-semibold">Drop:</span> {d.dropLocation}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified Transporters Visible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Transporters Section */}
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Verified Transporters Near Your Schools
              </h3>
              <p className="text-xs text-slate-500">
                Only transporters verified by OmniStud are eligible to serve school routes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transporters.map((t) => (
                <Card key={t.id} title={t.name}>
                  <div className="space-y-3 text-xs text-slate-600">
                    <p className="line-clamp-2">{t.description}</p>
                    <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                      <p><span className="font-medium text-slate-800">Area:</span> {t.area || t.location || "City Centre"}</p>
                      <p><span className="font-medium text-slate-800">School:</span> {t.school || "Guwahati Prep / DAV"}</p>
                      <p className="text-[#DC2626] font-bold text-sm pt-1">₹{t.price} / month</p>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/parent/dashboard/payments">
                        Book & Pay via Escrow
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

