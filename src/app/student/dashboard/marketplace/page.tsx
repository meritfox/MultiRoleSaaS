"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getMarketplaceItems } from "@/lib/services/marketplace";
import { MarketplaceItem, MarketplaceCategory } from "@/types";
import { BookOpen, PlusCircle, ShoppingBag, Tag } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
const CATEGORIES: { value: MarketplaceCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "BOOK", label: "Books" },
  { value: "UNIFORM", label: "Uniforms" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "OTHER", label: "Other" },
];

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory | "">("");

  useEffect(() => {
    getMarketplaceItems()
      .then(setItems)
      .catch((err) => console.error("Failed to load marketplace:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (category && i.category !== category) return false;
      if (search.trim()) {
        const n = search.trim().toLowerCase();
        if (!`${i.title} ${i.description}`.toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [items, search, category]);

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
      <DashboardLayout title="Marketplace">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Buy & Sell Marketplace</h2>
              <p className="text-sm text-slate-500">Browse items posted by students and parents.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/student/dashboard/marketplace/books"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4" /> Old Books
              </Link>
              <Link
                href="/student/dashboard/marketplace/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B91C1C]"
              >
                <PlusCircle className="h-4 w-4" /> Post Item
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description"
                icon={<ShoppingBag className="h-4 w-4" />}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2 pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c.value
                      ? "bg-[#DC2626] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <p className="text-center text-slate-500 py-8">No items found.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-xl border border-slate-200/60 bg-white p-4 shadow-soft transition-all duration-200 hover:shadow-lift"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      <Tag className="h-3 w-3" />
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                  {item.category === "BOOK" && (item.grade || item.school || item.board) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.grade && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-[#DC2626]">
                          Class {item.grade}
                        </span>
                      )}
                      {item.board && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {item.board}
                        </span>
                      )}
                      {item.school && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {item.school}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-lg font-bold text-[#DC2626]">₹{item.price}</span>
                    <span className="text-xs text-slate-500">
                      {item.condition ? item.condition.replace("_", " ") : ""}
                      {item.sellerName ? ` · ${item.sellerName}` : ""}
                    </span>
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
