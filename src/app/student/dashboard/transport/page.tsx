"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getAllServices, createServiceRequest } from "@/lib/services/services";
import { Service } from "@/types";
import { Bus } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

export default function StudentTransportPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const all = await getAllServices();
      setServices(all.filter((s) => s.providerType === "TRANSPORTER"));
      setLoading(false);
    };
    fetch();
  }, []);

  const handleRequest = async (service: Service) => {
    if (!user) return;
    setRequestingId(service.id);
    try {
      await createServiceRequest(user.uid, service);
      alert("Transport service requested.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) return <ProtectedRoute allowedRoles={[STUDENT_ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="School Transport">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">School Transport</h2>
          <Card title="Available Routes">
            {services.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transport routes available.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((service) => (
                  <div key={service.id} className="p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Bus className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{service.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-[#3b4cca]">₹{service.price}</span>
                      <Button size="sm" onClick={() => handleRequest(service)} isLoading={requestingId === service.id}>Request</Button>
                    </div>
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
