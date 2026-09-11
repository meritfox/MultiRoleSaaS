"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Toggle } from "@/components/ui/Toggle";
import {
  getCatalogItems,
  createCatalogItem,
  toggleCatalogItemActive,
  deleteCatalogItem,
} from "@/lib/services/catalog";
import { ServiceCatalogItem } from "@/types";
import { Trash2, ListPlus } from "lucide-react";

const ADMIN_ROLE = "SUPER_ADMIN";
const PROVIDER_TYPES = ["TEACHER", "TRANSPORTER", "INSTITUTION"];

export default function AdminCatalogPage() {
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [providerType, setProviderType] = useState("TEACHER");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getCatalogItems());
    } catch (err) {
      console.error("Failed to load catalog:", err);
      setError("Failed to load the master services list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer so the synchronous setLoading inside load() runs after effect body.
    queueMicrotask(() => {
      void load();
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createCatalogItem({ name, category, providerType });
      setItems([created, ...items]);
      setName("");
      setCategory("");
    } catch (err) {
      console.error(err);
      setError("Failed to add catalog item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: ServiceCatalogItem) => {
    try {
      await toggleCatalogItemActive(item.id, !item.active);
      setItems(items.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i)));
    } catch (err) {
      console.error(err);
      setError("Failed to update catalog item.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this item from the master list?")) return;
    try {
      await deleteCatalogItem(id);
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete catalog item.");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="Services Master List">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Services Master List</h2>
          <p className="text-sm text-slate-500">
            This master list defines all service types providers can offer on the platform.
            Providers pick from this list when creating services.
          </p>

          {error && <Alert variant="error">{error}</Alert>}

          <Card title="Add Master List Entry">
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-4">
              <Input
                label="Service Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Math Tutoring"
              />
              <Input
                label="Category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Tutoring"
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Provider Type</label>
                <Select
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value)}
                  options={PROVIDER_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  <ListPlus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            </form>
          </Card>

          <Card title={`Master List (${items.length} items)`}>
            {items.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No entries yet. Add the first service type above.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.category} · {item.providerType}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={item.active}
                        onChange={() => handleToggle(item)}
                        label={item.active ? "Active" : "Inactive"}
                      />
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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