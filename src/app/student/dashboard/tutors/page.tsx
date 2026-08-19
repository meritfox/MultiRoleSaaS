"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { getAllServices } from "@/lib/services/services";
import {
  Service,
  TeacherCategory,
  RATE_UNIT_LABELS,
  TEACHER_CATEGORY_LABELS,
} from "@/types";
import { GraduationCap, Building2, Star, MapPin } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
const TEACHER_CATEGORIES: TeacherCategory[] = [
  "SCHOOL_TEACHER",
  "RETIRED_PRIVATE_SCHOOL_TEACHER",
  "RETIRED_GOVT_SCHOOL_TEACHER",
  "OTHER",
];

type TypeFilter = "ALL" | "TEACHER" | "INSTITUTION";

export default function FindTeachersPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: Area, School, Subject, Hobby (Screen 11)
  const [area, setArea] = useState("");
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("");
  const [hobby, setHobby] = useState("");
  const [category, setCategory] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  useEffect(() => {
    const fetch = async () => {
      try {
        const all = await getAllServices();
        setServices(
          all.filter((s) => s.providerType === "TEACHER" || s.providerType === "INSTITUTION")
        );
      } catch (err) {
        console.error("Failed to load tutors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    const needle = (v: string) => v.trim().toLowerCase();
    return services.filter((s) => {
      if (typeFilter !== "ALL" && s.providerType !== typeFilter) return false;
      if (category && s.teacherCategory !== category) return false;
      if (needle(area)) {
        const hay = `${s.area ?? ""} ${s.location ?? ""}`.toLowerCase();
        if (!hay.includes(needle(area))) return false;
      }
      if (needle(school) && !(s.school ?? "").toLowerCase().includes(needle(school))) return false;
      if (needle(subject) && !(s.subject ?? "").toLowerCase().includes(needle(subject))) return false;
      if (needle(hobby) && !(s.hobby ?? "").toLowerCase().includes(needle(hobby))) return false;
      return true;
    });
  }, [services, area, school, subject, hobby, category, typeFilter]);

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
      <DashboardLayout title="Find Teacher / Institution">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Find Teacher / Institution</h2>
            <p className="text-sm text-slate-500">
              Filter by area, school, subject or hobby to find the right educator.
            </p>
          </div>

          <Card title="Filters">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["ALL", "TEACHER", "INSTITUTION"] as TypeFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? "bg-[#DC2626] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t === "INSTITUTION" ? (
                      <Building2 className="h-3.5 w-3.5" />
                    ) : (
                      <GraduationCap className="h-3.5 w-3.5" />
                    )}
                    {t === "ALL" ? "All" : t === "TEACHER" ? "Teachers" : "Institutions"}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Ulubari, Beltola" />
                <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Don Bosco" />
                <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
                <Input label="Hobby" value={hobby} onChange={(e) => setHobby(e.target.value)} placeholder="e.g. Music, Chess" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Teacher Category</label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={[
                      { value: "", label: "All categories" },
                      ...TEACHER_CATEGORIES.map((c) => ({
                        value: c,
                        label: TEACHER_CATEGORY_LABELS[c],
                      })),
                    ]}
                  />
                </div>
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <p className="text-center text-slate-500 py-8">
                No teachers or institutions match your filters.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        service.providerType === "INSTITUTION"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-red-100 text-[#DC2626]"
                      }`}
                    >
                      {service.providerType === "INSTITUTION" ? "Institution" : "Teacher"}
                    </span>
                  </div>

                  {service.teacherCategory && (
                    <span className="mb-2 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {TEACHER_CATEGORY_LABELS[service.teacherCategory] ?? service.teacherCategory}
                    </span>
                  )}

                  <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {service.subject && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {service.subject}
                      </span>
                    )}
                    {service.hobby && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {service.hobby}
                      </span>
                    )}
                    {service.school && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {service.school}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    {(service.area || service.location) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {service.area ?? service.location}
                      </span>
                    )}
                    {service.rating !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {service.rating} ({service.reviews ?? 0})
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-lg font-bold text-[#DC2626]">
                      ₹{service.price}
                      <span className="text-xs font-normal text-slate-500">
                        {service.rateUnit ? ` / ${RATE_UNIT_LABELS[service.rateUnit]}` : ""}
                      </span>
                    </span>
                    <Link
                      href={`/student/dashboard/tutors/detail?id=${service.id}`}
                      className="rounded-lg bg-[#DC2626] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#B91C1C]"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
