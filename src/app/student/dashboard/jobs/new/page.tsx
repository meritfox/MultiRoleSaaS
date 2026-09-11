"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { createJob } from "@/lib/services/jobs";
import { geocodeAddress } from "@/lib/services/geo";
import { PageHeader } from "@/components/ui/PageHeader";
import { MapPin, ArrowLeft } from "lucide-react";
import { Job } from "@/types";

const STUDENT_ROLE = "STUDENT";
const JOB_CATEGORIES = [
  "Tutoring Help",
  "Transport Request",
  "Book Exchange",
  "Errand / Task",
  "Other",
];

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Firestore rejects undefined values, so we must clean the payload
      const cleanPayload: Omit<Job, "id" | "posterId" | "status" | "createdAt"> = {
        title,
        description,
        category,
        posterName: user.displayName,
      };
      if (budget) cleanPayload.budget = parseFloat(budget);
      if (location) cleanPayload.location = location;

      if (!coords && location.trim()) {
        const geocoded = await geocodeAddress(location);
        if (geocoded) {
          cleanPayload.lat = geocoded.lat;
          cleanPayload.lng = geocoded.lng;
        }
      }
      if (coords?.lat !== undefined) cleanPayload.lat = coords.lat;
      if (coords?.lng !== undefined) cleanPayload.lng = coords.lng;
      await createJob(user.uid, cleanPayload);
      router.push("/student/dashboard/jobs");
    } catch (err) {
      console.error("Failed to post job:", err);
      setError("Failed to post your request. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Post a Job">
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader
            title="Post a Job"
            description="Describe what you need help with."
            actions={
              <Link
                href="/student/dashboard/jobs"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            }
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Card title="Job Details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Need a Math tutor for Grade 5"
              />
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what you need, timings, and any requirements."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={JOB_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <Input
                  label="Budget (₹, optional)"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Location (optional)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ulubari, Guwahati"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureLocation}
                    isLoading={locating}
                    className="shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                {coords && (
                  <p className="mt-1 text-xs text-emerald-600">
                    GPS captured — your request will be sorted by distance.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Post Request
              </Button>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}