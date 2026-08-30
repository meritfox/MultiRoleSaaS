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
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getServiceById, createServiceRequest } from "@/lib/services/services";
import { getUserById } from "@/lib/services/users";
import {
  Service,
  UserProfile,
  RATE_UNIT_LABELS,
  TEACHER_CATEGORY_LABELS,
  TeacherCategory,
} from "@/types";
import { Star, MapPin, ArrowLeft, GraduationCap } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

function TeacherDetailContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("id") ?? "";

  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
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
          const providerProfile = await getUserById(svc.providerId).catch(() => null);
          setProvider(providerProfile);
        }
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [serviceId]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;
    setRequesting(true);
    setError(null);
    try {
      await createServiceRequest(user.uid, service);
      setSuccess(true);
      setNote("");
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
        <DashboardLayout title="Profile Not Found">
          <Card>
            <p className="py-8 text-center text-slate-500">
              This teacher / institution profile could not be found.
            </p>
            <div className="flex justify-center pb-4">
              <Link href="/student/dashboard/tutors">
                <Button variant="outline">Back to search</Button>
              </Link>
            </div>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Teacher / Institution Profile">
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
                  <h2 className="text-2xl font-bold text-slate-900">{service.name}</h2>
                  {provider?.displayName && (
                    <p className="text-sm text-slate-500">by {provider.displayName}</p>
                  )}
                </div>
                <Badge variant={service.providerType === "INSTITUTION" ? "purple" : "indigo"}>
                  {service.providerType === "INSTITUTION" ? "Institution" : "Teacher"}
                </Badge>
              </div>

              {service.teacherCategory && (
                <Badge variant="slate">
                  {TEACHER_CATEGORY_LABELS[service.teacherCategory as TeacherCategory] ??
                    service.teacherCategory}
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {service.rating !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {service.rating} rating · {service.reviews ?? 0} reviews
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
                {provider && (provider as { bio?: string }).bio && (
                  <p className="mt-2 text-sm text-slate-500">
                    {(provider as { bio?: string }).bio}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {service.subject && (
                  <Badge variant="indigo">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Subject: {service.subject}
                    </span>
                  </Badge>
                )}
                {service.hobby && <Badge variant="slate">Hobby: {service.hobby}</Badge>}
                {service.school && <Badge variant="slate">School: {service.school}</Badge>}
              </div>

              <p className="text-2xl font-bold text-[#DC2626]">
                ₹{service.price}
                <span className="text-sm font-normal text-slate-500">
                  {service.rateUnit ? ` per ${RATE_UNIT_LABELS[service.rateUnit]}` : ""}
                </span>
              </p>
            </div>
          </Card>

          <Card title="Request this service">
            {success ? (
              <Alert variant="success">
                Request sent! The provider will review and approve your request.
              </Alert>
            ) : (
              <form onSubmit={handleRequest} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Message to the provider (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. I need Math tuition for Grade 5, evenings preferred."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                  />
                </div>
                <Button type="submit" isLoading={requesting} className="w-full">
                  Send Request
                </Button>
              </form>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function TeacherDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <TeacherDetailContent />
    </Suspense>
  );
}
