"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getJobs, distanceKm } from "@/lib/services/jobs";
import { Job } from "@/types";
import { Briefcase, MapPin, PlusCircle, Search, Navigation2 } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

type Coords = { lat: number; lng: number };

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [appliedSortByDistance, setAppliedSortByDistance] = useState(false);
  const [distanceLimitKm, setDistanceLimitKm] = useState("");
  const [appliedDistanceLimitKm, setAppliedDistanceLimitKm] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedSortByDistance(sortByDistance);
    setAppliedDistanceLimitKm(distanceLimitKm);
  };


  useEffect(() => {
    getJobs()
      .then(setJobs)
      .catch((err) => console.error("Failed to load jobs:", err))
      .finally(() => setLoading(false));

    // Best-effort: capture user coordinates for distance sorting.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null),
        { timeout: 8000 }
      );
    }
  }, []);

  const visible = useMemo(() => {
    const n = appliedSearch.trim().toLowerCase();
    let list = jobs.filter(
      (j) => !n || `${j.title} ${j.description} ${j.category}`.toLowerCase().includes(n)
    );
    if (appliedDistanceLimitKm && coords) {
      list = list.filter((job) => {
        if (job.lat === undefined || job.lng === undefined) return false;
        return (
          distanceKm(coords, { lat: job.lat, lng: job.lng }) <= Number(appliedDistanceLimitKm)
        );
      });
    }
    if (appliedSortByDistance && coords) {
      list = [...list].sort((a, b) => {
        const da = a.lat !== undefined && a.lng !== undefined ? distanceKm(coords, { lat: a.lat, lng: a.lng }) : Number.MAX_VALUE;
        const db = b.lat !== undefined && b.lng !== undefined ? distanceKm(coords, { lat: b.lat, lng: b.lng }) : Number.MAX_VALUE;
        return da - db;
      });
    }
    return list;
  }, [jobs, appliedSearch, appliedSortByDistance, appliedDistanceLimitKm, coords]);

  const distanceFor = (job: Job): number | null => {
    if (!coords || job.lat === undefined || job.lng === undefined) return null;
    return distanceKm(coords, { lat: job.lat, lng: job.lng });
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

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Job Board">
        <div className="max-w-5xl mx-auto space-y-6">
          <PageHeader
            title="Job Board"
            description="Browse jobs & service requests near you."
            actions={
              <Button asChild>
                <Link href="/student/dashboard/jobs/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
                </Link>
              </Button>
            }
          />

          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title, category or keyword"
                icon={<Search className="h-4 w-4" />}
              />
              <Input
                value={distanceLimitKm}
                onChange={(e) => setDistanceLimitKm(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Within distance (km)"
                label="Within distance"
              />
              <div className="flex items-end">
                <button
                  onClick={() => setSortByDistance((v) => !v)}
                  className={`h-10 w-full inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    sortByDistance
                      ? "bg-gradient-to-b from-[#ef4444] to-[#DC2626] text-white shadow-soft"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  <Navigation2 className="h-3.5 w-3.5" />
                  Nearest first
                </button>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  Search
                </Button>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try a different search, or post your own request."
              actionLabel="Post a Job"
              actionHref="/student/dashboard/jobs/new"
            />
          ) : (
            <div className="space-y-3">
              {visible.map((job) => {
                const dist = distanceFor(job);
                return (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft transition-all duration-200 hover:shadow-lift sm:flex-row sm:items-start"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100/70 text-[#DC2626]">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                          {job.category}
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                            {dist !== null && ` - ${dist.toFixed(1)} km away`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {job.budget !== undefined && (
                        <p className="font-bold text-[#DC2626]">{job.budget}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}