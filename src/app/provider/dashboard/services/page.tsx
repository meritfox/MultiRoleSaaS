"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import {
  getServicesByProvider,
  createService,
  updateService,
  deleteService,
} from "@/lib/services/services";
import { getCatalogItems } from "@/lib/services/catalog";
import {
  Service,
  ServiceCatalogItem,
  RateUnit,
  TeacherCategory,
  RATE_UNIT_LABELS,
  TEACHER_CATEGORY_LABELS,
} from "@/types";
import { Pencil, Trash2 } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

const RATE_UNITS: RateUnit[] = ["PER_HOUR", "PER_SESSION", "PER_DAY", "PER_MONTH"];
const TEACHER_CATEGORIES: TeacherCategory[] = [
  "SCHOOL_TEACHER",
  "RETIRED_PRIVATE_SCHOOL_TEACHER",
  "RETIRED_GOVT_SCHOOL_TEACHER",
  "OTHER",
];

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rateUnit, setRateUnit] = useState<RateUnit>("PER_MONTH");
  const [catalogId, setCatalogId] = useState("");
  const [providerType, setProviderType] = useState("");
  const [category, setCategory] = useState("");
  const [teacherCategory, setTeacherCategory] = useState<TeacherCategory | "">("");
  const [subject, setSubject] = useState("");
  const [hobby, setHobby] = useState("");
  const [school, setSchool] = useState("");
  const [area, setArea] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      try {
        const [svc, cat] = await Promise.all([
          getServicesByProvider(user.uid),
          getCatalogItems().catch(() => []),
        ]);
        setServices(svc);
        setCatalog(cat.filter((c) => c.active));
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load your services.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  /** Selecting an entry from the admin master list auto-fills type & category. */
  const handleCatalogSelect = (id: string) => {
    setCatalogId(id);
    const item = catalog.find((c) => c.id === id);
    if (item) {
      setName(item.name);
      setProviderType(item.providerType);
      setCategory(item.category);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setRateUnit("PER_MONTH");
    setCatalogId("");
    setProviderType("");
    setCategory("");
    setTeacherCategory("");
    setSubject("");
    setHobby("");
    setSchool("");
    setArea("");
    setVehicleType("");
    setEditingId(null);
  };

  const handleEdit = (service: Service) => {
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setRateUnit(service.rateUnit ?? "PER_MONTH");
    setProviderType(service.providerType);
    setCategory(service.category ?? "");
    setTeacherCategory((service.teacherCategory as TeacherCategory) ?? "");
    setSubject(service.subject ?? "");
    setHobby(service.hobby ?? "");
    setSchool(service.school ?? "");
    setArea(service.area ?? "");
    setVehicleType(service.vehicleType ?? "");
    setEditingId(service.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(serviceId);
      setServices(services.filter((s) => s.id !== serviceId));
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Failed to delete service.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!providerType) {
      setError("Please select a service from the master list.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const serviceData = {
        name,
        description,
        price: parseFloat(price),
        rateUnit,
        providerType,
        category: category || undefined,
        teacherCategory: (providerType === "TEACHER" || providerType === "INSTITUTION") && teacherCategory
          ? (teacherCategory as TeacherCategory)
          : undefined,
        subject: subject || undefined,
        hobby: hobby || undefined,
        school: school || undefined,
        area: area || undefined,
        vehicleType: providerType === "TRANSPORTER" ? vehicleType || undefined : undefined,
      };

      if (editingId) {
        await updateService(editingId, serviceData);
        setServices(
          services.map((s) => (s.id === editingId ? { ...s, ...serviceData } : s))
        );
      } else {
        const created = await createService(user.uid, serviceData);
        setServices([created, ...services]);
      }
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving service:", err);
      setError("Failed to save service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title="My Services">
        <div className="max-w-6xl mx-auto">
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {success && <Alert variant="success" className="mb-4">Service saved successfully!</Alert>}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card title={editingId ? "Edit Service" : "Add New Service"}>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Service Type (Master List)
                    </label>
                    <Select
                      required
                      value={catalogId}
                      onChange={(e) => handleCatalogSelect(e.target.value)}
                      options={[
                        { value: "", label: "-- Select from master list --" },
                        ...catalog.map((c) => ({
                          value: c.id,
                          label: `${c.name} · ${c.providerType}`,
                        })),
                      ]}
                    />
                    <p className="text-xs text-slate-400">
                      The master list is managed by the platform admin.
                    </p>
                  </div>
                  <Input
                    label="Service Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Math Tutoring - Grade 5"
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Rate (₹)"
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 500"
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Unit</label>
                      <Select
                        value={rateUnit}
                        onChange={(e) => setRateUnit(e.target.value as RateUnit)}
                        options={RATE_UNITS.map((u) => ({
                          value: u,
                          label: `per ${RATE_UNIT_LABELS[u]}`,
                        }))}
                      />
                    </div>
                  </div>

                  {(providerType === "TEACHER" || providerType === "INSTITUTION") && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Teacher Category
                      </label>
                      <Select
                        value={teacherCategory}
                        onChange={(e) => setTeacherCategory(e.target.value as TeacherCategory | "")}
                        options={[
                          { value: "", label: "-- Select category --" },
                          ...TEACHER_CATEGORIES.map((c) => ({
                            value: c,
                            label: TEACHER_CATEGORY_LABELS[c],
                          })),
                        ]}
                      />
                    </div>
                  )}

                  {providerType === "TRANSPORTER" && (
                    <Input
                      label="Vehicle Type"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      placeholder="e.g. Bus, Van, Mini Bus"
                    />
                  )}

                  <Input
                    label="Subject (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                  <Input
                    label="Hobby (optional)"
                    value={hobby}
                    onChange={(e) => setHobby(e.target.value)}
                    placeholder="e.g. Music, Chess"
                  />
                  <Input
                    label="School (optional)"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Don Bosco School"
                  />
                  <Input
                    label="Area / Locality (optional)"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Ulubari, Guwahati"
                  />

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                      {editingId ? "Update" : "Add"}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Your Active Services
              </h2>
              {services.length === 0 ? (
                <Card>
                  <p className="text-center text-slate-500">
                    You haven&apos;t added any services yet.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-slate-900">{service.name}</h3>
                          <span className="font-bold text-[#DC2626]">
                            ₹{service.price}
                            <span className="text-xs font-normal text-slate-500">
                              {service.rateUnit ? `/${RATE_UNIT_LABELS[service.rateUnit]}` : ""}
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-[#DC2626]">
                            {service.providerType}
                          </span>
                          {service.teacherCategory && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                              {TEACHER_CATEGORY_LABELS[service.teacherCategory as TeacherCategory] ??
                                service.teacherCategory}
                            </span>
                          )}
                          {service.vehicleType && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                              {service.vehicleType}
                            </span>
                          )}
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {service.category ?? "Service"}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(service)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(service.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
