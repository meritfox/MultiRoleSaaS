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
import { MarketplaceCategory, MarketplaceCondition, MarketplaceItem } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowLeft } from "lucide-react";
import { geocodeAddress } from "@/lib/services/geo";

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
  const [location, setLocation] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Firestore rejects undefined values, so we must clean the payload
      const cleanPayload: Omit<MarketplaceItem, "id" | "sellerId" | "status" | "createdAt"> = {
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        sellerName: user.displayName,
        sellerPhone: sellerPhone || user.phoneNumber || undefined,
        location: location || undefined,
      };
      if (category === "BOOK") {
        if (grade) cleanPayload.grade = grade;
        if (school) cleanPayload.school = school;
        if (board) cleanPayload.board = board;
      }

      const coords = await geocodeAddress([location, school].filter(Boolean).join(", "));
      if (coords) {
        cleanPayload.lat = coords.lat;
        cleanPayload.lng = coords.lng;
      }
      await createMarketplaceItem(user.uid, cleanPayload);
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
          <PageHeader
            title="Post an Item for Sale"
            description="List second-hand books and school items."
            actions={
              <Link
                href="/student/dashboard/marketplace"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            }
          />

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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow transition-all duration-200"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Price (â‚¹)"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Contact Number"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ulubari, Guwahati"
                />
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
