"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills, FilterPillOption } from "@/components/ui/FilterPills";
import { getMarketplaceItems } from "@/lib/services/marketplace";
import { MarketplaceItem, MarketplaceCategory } from "@/types";
import { BookOpen, PlusCircle, ShoppingBag } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
const CATEGORIES: FilterPillOption<MarketplaceCategory | "">[] = [
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
          <PageHeader
            title="Marketplace"
            description="Buy & sell old books, uniforms and school items."
            actions={
              <>
                <Button variant="outline" asChild>
                  <Link href="/student/dashboard/marketplace/books">
                    <BookOpen className="mr-2 h-4 w-4" /> Old Books
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/student/dashboard/marketplace/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Post Item
                  </Link>
                </Button>
              </>
            }
          />

          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description"
              icon={<ShoppingBag className="h-4 w-4" />}
            />
            <FilterPills options={CATEGORIES} value={category} onChange={setCategory} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No items found"
              description="Try a different search or category."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-lift"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <Badge variant="slate">{item.category}</Badge>
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
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-lg font-bold text-[#DC2626]">₹{item.price}</span>
                    <span className="text-xs text-slate-500">
                      {item.condition ? item.condition.replace("_", " ") : ""}
                      {item.sellerName ? ` - ${item.sellerName}` : ""}
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