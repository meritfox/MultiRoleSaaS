"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getMarketplaceItems } from "@/lib/services/marketplace";
import { MarketplaceItem } from "@/types";
import { ShoppingCart, BookOpen, Shirt, Package, Tag, Phone } from "lucide-react";

const ROLE = "PARENT";

export default function ParentMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  useEffect(() => {
    getMarketplaceItems()
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "ALL"
    ? items
    : items.filter((i) => i.category === activeCategory);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="Parent Marketplace">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-[#DC2626]" />
              School Marketplace
            </h2>
            <p className="text-sm text-slate-600">
              Buy and sell old school textbooks, uniforms, stationery, and learning materials safely.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: "All Items", icon: Tag },
              { id: "BOOK", label: "Books (Buy / Sell Old Books)", icon: BookOpen },
              { id: "UNIFORM", label: "Uniforms", icon: Shirt },
              { id: "STATIONERY", label: "Stationery & Supplies", icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === tab.id
                    ? "bg-[#DC2626] text-white shadow-soft"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <div className="text-center py-10">
                <ShoppingCart className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No items available in this category yet</p>
                <p className="text-xs text-slate-500 mt-1">Check back soon as parents and students post listings.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                      <span className="text-base font-bold text-[#DC2626]">₹{item.price}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                    {item.school && (
                      <p className="text-[11px] text-slate-400">🏫 {item.school}</p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500 truncate">Seller: {item.sellerName || "Verified Parent"}</span>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => alert(`Contact seller at: ${item.sellerPhone || "Support via OmniStud Escrow"}`)}>
                      <Phone className="h-3.5 w-3.5 mr-1" /> Contact
                    </Button>
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

