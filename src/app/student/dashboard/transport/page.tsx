"use client";

import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ServiceCard } from "@/components/student/ServiceCard";
import { getAllServices } from "@/lib/services/services";
import { Service } from "@/types";
import { distanceKm } from "@/lib/services/geo";
import { Bus } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
const VEHICLE_TYPES = ["Bus", "Van", "Mini Bus", "Car", "Auto"];

export default function StudentTransportPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: Area, School, Vehicle Type, Reviews (Screen 13)
  const [area, setArea] = useState("");
  // Applied filter state
  const [searchArea, setSearchArea] = useState("");
  const [searchSchool, setSearchSchool] = useState("");
  const [searchVehicleType, setSearchVehicleType] = useState("");
  const [searchMinRating, setSearchMinRating] = useState("");
  const [distanceLimitKm, setDistanceLimitKm] = useState("");
  const [searchDistanceLimitKm, setSearchDistanceLimitKm] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = () => {
    setSearchArea(area);
    setSearchSchool(school);
    setSearchVehicleType(vehicleType);
    setSearchMinRating(minRating);
    setSearchDistanceLimitKm(distanceLimitKm);
  };

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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null),
        { timeout: 8000 }
      );
    }
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
      if (needle(searchArea)) {
        const hay = `${s.area ?? ""} ${s.location ?? ""}`.toLowerCase();
        if (!hay.includes(needle(searchArea))) return false;
      }
      if (needle(searchSchool) && !(s.school ?? "").toLowerCase().includes(needle(searchSchool))) {
        return false;
      }
      if (searchVehicleType && s.vehicleType !== searchVehicleType) return false;
      if (searchMinRating && (s.rating ?? 0) < Number(searchMinRating)) return false;
      if (searchDistanceLimitKm && coords) {
        if (s.lat === undefined || s.lng === undefined) return false;
        const d = distanceKm(coords, { lat: s.lat, lng: s.lng });
        if (d > Number(searchDistanceLimitKm)) return false;
      }
      return true;
    });
  }, [
    services,
    searchArea,
    searchSchool,
    searchVehicleType,
    searchMinRating,
    searchDistanceLimitKm,
    coords,
  ]);

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
      <DashboardLayout title="School Transport">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader
            title="School Transport"
            description="Filter routes by area, school, vehicle type and rating."
          />

          <Card title="Filters">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <label className="text-sm font-medium text-slate-700">Minimum Rating</label>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Within distance</label>
                <Select
                  value={distanceLimitKm}
                  onChange={(e) => setDistanceLimitKm(e.target.value)}
                  options={[
                    { value: "", label: "Any distance" },
                    { value: "1", label: "Within 1 km" },
                    { value: "2", label: "Within 2 km" },
                    { value: "5", label: "Within 5 km" },
                    { value: "10", label: "Within 10 km" },
                  ]}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Bus}
              title="No transport routes match your filters"
              description="Try clearing some filters or searching another area or school."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((service) => {
                const chips = [service.school].filter((c): c is string => Boolean(c));
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    chips={chips}
                    defaultRateUnitLabel="month"
                    detailHref={`/student/dashboard/transport/detail?id=${service.id}`}
                    detailLabel="View & Book"
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