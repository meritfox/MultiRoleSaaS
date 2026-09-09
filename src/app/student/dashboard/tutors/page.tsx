"use client";

import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills, FilterPillOption } from "@/components/ui/FilterPills";
import { ServiceCard } from "@/components/student/ServiceCard";
import { getAllServices } from "@/lib/services/services";
import {
  Service,
  TeacherCategory,
  TEACHER_CATEGORY_LABELS,
} from "@/types";
import { GraduationCap, Building2 } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
const TEACHER_CATEGORIES: TeacherCategory[] = [
  "SCHOOL_TEACHER",
  "RETIRED_PRIVATE_SCHOOL_TEACHER",
  "RETIRED_GOVT_SCHOOL_TEACHER",
  "OTHER",
];

type TypeFilter = "ALL" | "TEACHER" | "INSTITUTION";

const TYPE_OPTIONS: FilterPillOption<TypeFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "TEACHER", label: "Teachers", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { value: "INSTITUTION", label: "Institutions", icon: <Building2 className="h-3.5 w-3.5" /> },
];

export default function FindTeachersPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: Area, School, Subject, Hobby (Screen 11)
  const [searchArea, setSearchArea] = useState("");
  const [searchSchool, setSearchSchool] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [searchHobby, setSearchHobby] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchTypeFilter, setSearchTypeFilter] = useState<TypeFilter>("ALL");

  const handleSearch = () => {
    setSearchArea(area);
    setSearchSchool(school);
    setSearchSubject(subject);
    setSearchHobby(hobby);
    setSearchCategory(category);
    setSearchTypeFilter(typeFilter);
  };

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
      <DashboardLayout title="Find Tutors">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader
            title="Find Tutors"
            description="Search teachers and institutions by area, school, subject or hobby."
          />

          <Card title="Filters">
            <div className="space-y-4">
              <FilterPills options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Ulubari, Beltola" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Don Bosco" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                <Input label="Hobby" value={hobby} onChange={(e) => setHobby(e.target.value)} placeholder="e.g. Music, Chess" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
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
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full" size="lg">
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No tutors match your filters"
              description="Try clearing some filters or searching a different school, subject or area."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((service) => {
                const chips = [service.subject, service.hobby, service.school].filter(
                  (c): c is string => Boolean(c)
                );
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    chips={chips}
                    detailHref={`/student/dashboard/tutors/detail?id=${service.id}`}
                    detailLabel="View Profile"
                  />
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}