"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { createMarketplaceItem } from "@/lib/services/marketplace";
import { MarketplaceCategory, MarketplaceCondition } from "@/types";

const STUDENT_ROLE = "STUDENT";
const CATEGORIES: MarketplaceCategory[] = ["BOOK", "UNIFORM", "STATIONERY", "ELECTRONICS", "OTHER"];
const CONDITIONS: MarketplaceCondition[] = ["NEW", "LIKE_NEW", "GOOD", "FAIR"];

export default function PostItemPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory>("BOOK");
  const [condition, setCondition] = useState<MarketplaceCondition>("GOOD");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [board, setBoard] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createMarketplaceItem(user.uid, {
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        sellerName: user.displayName,
        grade: category === "BOOK" ? grade || undefined : undefined,
        school: category === "BOOK" ? school || undefined : undefined,
        board: category === "BOOK" ? board || undefined : undefined,
      });
      router.push("/student/dashboard/marketplace");
    } catch (err) {
      console.error("Failed to post item:", err);
      setError("Failed to post your item. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Post Item for Sale">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Post an Item for Sale</h2>
            <Link
              href="/student/dashboard/marketplace"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← Back
            </Link>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Card title="Item Details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NCERT Class 5 Science Book"
              />
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the item, its condition, and where buyers can collect it."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Price (₹)"
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 150"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Condition</label>
                  <Select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as MarketplaceCondition)}
                    options={CONDITIONS.map((c) => ({ value: c, label: c.replace("_", " ") }))}
                  />
                </div>
              </div>
              {category === "BOOK" && (
                <div className="space-y-4 rounded-lg bg-red-50/60 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Book matching details (helps buyers filter by class, school, board)
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      label="Class / Grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="e.g. 5"
                    />
                    <Input
                      label="School"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Don Bosco"
                    />
                    <Input
                      label="Board"
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      placeholder="e.g. CBSE"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Post Item for Sale
              </Button>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}