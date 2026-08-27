"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { getServiceById, createServiceRequest } from "@/lib/services/services";
import { getUserById } from "@/lib/services/users";
import { Service, ServiceProviderProfile, RATE_UNIT_LABELS } from "@/types";
import { Bus, Star, MapPin, ArrowLeft } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

function TransporterDetailContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("id") ?? "";

  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<ServiceProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingPoint, setStartingPoint] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    const fetch = async () => {
      try {
        const svc = await getServiceById(serviceId);
        setService(svc);
        if (svc?.providerId) {
          const profile = await getUserById(svc.providerId).catch(() => null);
          setProvider(profile as ServiceProviderProfile | null);
        }
      } catch (err) {
        console.error("Failed to load transporter profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [serviceId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;
    setRequesting(true);
    setError(null);
    try {
      await createServiceRequest(user.uid, service);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!service) {
    return (
      <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
        <DashboardLayout title="Transporter Not Found">
          <Card>
            <p className="py-8 text-center text-slate-500">
              This transport route could not be found.
            </p>
            <div className="flex justify-center pb-4">
              <Link href="/student/dashboard/transport">
                <Button variant="outline">Back to transport</Button>
              </Link>
            </div>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Transporter Profile">
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to results
          </button>

          <Card>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <Bus className="h-6 w-6 text-amber-600" />
                    {service.name}
                  </h2>
                  {provider?.displayName && (
                    <p className="text-sm text-slate-500">Operated by {provider.displayName}</p>
                  )}
                </div>
                {service.vehicleType && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {service.vehicleType}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {service.rating !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {service.rating} · {service.reviews ?? 0} reviews
                  </span>
                )}
                {(service.area || service.location) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {service.area ?? service.location}
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-slate-50/70 p-4">
                <p className="text-sm text-slate-700">{service.description}</p>
              </div>

              {(provider?.vehicleNumber || provider?.licenseNumber || service.school) && (
                <div className="grid gap-2 rounded-lg border border-slate-200/60 p-4 text-sm sm:grid-cols-3">
                  {service.school && (
                    <div>
                      <p className="text-xs text-slate-400">Serves School</p>
                      <p className="font-medium text-slate-800">{service.school}</p>
                    </div>
                  )}
                  {provider?.vehicleNumber && (
                    <div>
                      <p className="text-xs text-slate-400">Vehicle No.</p>
                      <p className="font-medium text-slate-800">{provider.vehicleNumber}</p>
                    </div>
                  )}
                  {provider?.licenseNumber && (
                    <div>
                      <p className="text-xs text-slate-400">License</p>
                      <p className="font-medium text-slate-800">{provider.licenseNumber}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-2xl font-bold text-[#DC2626]">
                ₹{service.price}
                <span className="text-sm font-normal text-slate-500">
                  {service.rateUnit ? ` per ${RATE_UNIT_LABELS[service.rateUnit]}` : " per month"}
                </span>
              </p>
            </div>
          </Card>

          <Card title="Book this transport">
            {success ? (
              <Alert variant="success">
                Booking request sent! The transporter will confirm your seat. You can track the
                vehicle live once approved.
              </Alert>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Your pickup point (optional)
                  </label>
                  <input
                    value={startingPoint}
                    onChange={(e) => setStartingPoint(e.target.value)}
                    placeholder="e.g. Ulubari Bus Stop"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                  />
                </div>
                <Button type="submit" isLoading={requesting} className="w-full">
                  Request Booking
                </Button>
              </form>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function TransporterDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <TransporterDetailContent />
    </Suspense>
  );
}
