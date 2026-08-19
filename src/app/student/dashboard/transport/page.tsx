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
import { Service, RATE_UNIT_LABELS } from "@/types";
import { Bus, Star, MapPin } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
const VEHICLE_TYPES = ["Bus", "Van", "Mini Bus", "Car", "Auto"];

export default function StudentTransportPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: Area, School, Vehicle Type, Reviews (Screen 13)
  const [area, setArea] = useState("");
  const [school, setSchool] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [minRating, setMinRating] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const all = await getAllServices();
        setServices(all.filter((s) => s.providerType === "TRANSPORTER"));
      } catch (err) {
        console.error("Failed to load transport services:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const vehicleOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(services.map((s) => s.vehicleType).filter(Boolean))
    ) as string[];
    return Array.from(new Set([...VEHICLE_TYPES, ...fromData]));
  }, [services]);

  const filtered = useMemo(() => {
    const needle = (v: string) => v.trim().toLowerCase();
    return services.filter((s) => {
      if (needle(area)) {
        const hay = `${s.area ?? ""} ${s.location ?? ""}`.toLowerCase();
        if (!hay.includes(needle(area))) return false;
      }
      if (needle(school) && !(s.school ?? "").toLowerCase().includes(needle(school))) return false;
      if (vehicleType && s.vehicleType !== vehicleType) return false;
      if (minRating && (s.rating ?? 0) < Number(minRating)) return false;
      return true;
    });
  }, [services, area, school, vehicleType, minRating]);

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
      <DashboardLayout title="Find School Transportation">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Find School Transportation</h2>
            <p className="text-sm text-slate-500">
              Filter by area, school, vehicle type and reviews.
            </p>
          </div>

          <Card title="Filters">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Ulubari" />
              <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. City Prep" />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Vehicle Type</label>
                <Select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  options={[
                    { value: "", label: "All vehicles" },
                    ...vehicleOptions.map((v) => ({ value: v, label: v })),
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Min. Rating</label>
                <Select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  options={[
                    { value: "", label: "Any rating" },
                    { value: "4.5", label: "4.5+ stars" },
                    { value: "4", label: "4+ stars" },
                    { value: "3", label: "3+ stars" },
                  ]}
                />
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <p className="text-center text-slate-500 py-8">
                No transport routes match your filters.
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
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    </div>
                    {service.vehicleType && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        {service.vehicleType}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
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
                        {service.rating} ({service.reviews ?? 0} reviews)
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-lg font-bold text-[#DC2626]">
                      ₹{service.price}
                      <span className="text-xs font-normal text-slate-500">
                        {service.rateUnit ? ` / ${RATE_UNIT_LABELS[service.rateUnit]}` : " / month"}
                      </span>
                    </span>
                    <Link
                      href={`/student/dashboard/transport/detail?id=${service.id}`}
                      className="rounded-lg bg-[#DC2626] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#B91C1C]"
                    >
                      View & Book
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
