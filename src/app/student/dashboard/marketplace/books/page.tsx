"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getMarketplaceItems } from "@/lib/services/marketplace";
import { getUserById } from "@/lib/services/users";
import { MarketplaceItem, StudentProfile } from "@/types";
import { BookOpen, Phone, MapPin, Star } from "lucide-react";
import { distanceKm } from "@/lib/services/geo";
import {
  addSellerReview,
  getSellerReviewSummary,
} from "@/lib/services/reviews";

const STUDENT_ROLE = "STUDENT";

export default function OldBooksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters: Class, School, Board (Screen 17)
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [board, setBoard] = useState("");
  const [matchMine, setMatchMine] = useState(false);
  const [searchGrade, setSearchGrade] = useState("");
  const [searchSchool, setSearchSchool] = useState("");
  const [searchBoard, setSearchBoard] = useState("");
  const [searchMatchMine, setSearchMatchMine] = useState(false);
  const [distanceLimitKm, setDistanceLimitKm] = useState("");
  const [appliedDistanceLimitKm, setAppliedDistanceLimitKm] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sellerStats, setSellerStats] = useState<Record<string, { average: number; count: number }>>({});
  const [reviewingSellerId, setReviewingSellerId] = useState<string | null>(null);
  const [sellerRating, setSellerRating] = useState("5");
  const [sellerComment, setSellerComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMarketplaceItems(), getUserById(user.uid).catch(() => null)])
      .then(([all, prof]) => {
        setItems(all.filter((i) => i.category === "BOOK"));
        setProfile(prof as StudentProfile | null);
      })
      .catch((err) => console.error("Failed to load books:", err))
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null),
        { timeout: 8000 }
      );
    }
  }, [user]);

  useEffect(() => {
    if (items.length === 0) return;
    const sellerIds = Array.from(new Set(items.map((i) => i.sellerId)));
    Promise.all(
      sellerIds.map(async (sid) => {
        const summary = await getSellerReviewSummary(sid).catch(() => ({ average: 0, count: 0 }));
        return [sid, summary] as const;
      })
    ).then((entries) => {
      const map: Record<string, { average: number; count: number }> = {};
      for (const [sid, summary] of entries) map[sid] = summary;
      setSellerStats(map);
    });
  }, [items]);

  const filtered = useMemo(() => {
    const needle = (v: string) => v.trim().toLowerCase();
    return items.filter((i) => {
      if (searchMatchMine && profile) {
        if (
          (profile.grade && i.grade === profile.grade) ||
          (profile.school && i.school && i.school.toLowerCase() === profile.school.toLowerCase()) ||
          (profile.board && i.board && i.board.toLowerCase() === profile.board.toLowerCase())
        ) {
          return true;
        }
        return false;
      }
      if (needle(searchGrade) && !(i.grade ?? "").toLowerCase().includes(needle(searchGrade))) {
        return false;
      }
      if (needle(searchSchool) && !(i.school ?? "").toLowerCase().includes(needle(searchSchool))) {
        return false;
      }
      if (needle(searchBoard) && !(i.board ?? "").toLowerCase().includes(needle(searchBoard))) {
        return false;
      }
      if (appliedDistanceLimitKm && coords) {
        if (i.lat === undefined || i.lng === undefined) return false;
        const d = distanceKm(coords, { lat: i.lat, lng: i.lng });
        if (d > Number(appliedDistanceLimitKm)) return false;
      }
      return true;
    });
  }, [
    items,
    searchGrade,
    searchSchool,
    searchBoard,
    searchMatchMine,
    profile,
    appliedDistanceLimitKm,
    coords,
  ]);

  const handleSearch = () => {
    setSearchGrade(grade);
    setSearchSchool(school);
    setSearchBoard(board);
    setSearchMatchMine(matchMine);
    setAppliedDistanceLimitKm(distanceLimitKm);
  };

  const handleSellerReview = async (sellerId: string) => {
    if (!user || !sellerComment.trim()) return;
    setError(null);
    try {
      await addSellerReview({
        sellerId,
        reviewerId: user.uid,
        reviewerName: user.displayName,
        rating: Number(sellerRating),
        comment: sellerComment.trim(),
      });
      const summary = await getSellerReviewSummary(sellerId);
      setSellerStats((prev) => ({ ...prev, [sellerId]: summary }));
      setSellerComment("");
      setSellerRating("5");
      setReviewingSellerId(null);
    } catch (err) {
      setError((err as Error).message || "Failed to submit seller review.");
    }
  };

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
      <DashboardLayout title="Old Books">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader
            title="Old Books"
            description="Match old textbooks by class, school and board."
            actions={
              <Button asChild>
                <Link href="/student/dashboard/marketplace/new">Post a Book</Link>
              </Button>
            }
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Card title="Matching Filters">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Class" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 5" />
                <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Don Bosco" />
                <Input label="Board" value={board} onChange={(e) => setBoard(e.target.value)} placeholder="e.g. CBSE" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Within distance (km)"
                  value={distanceLimitKm}
                  onChange={(e) => setDistanceLimitKm(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 2"
                />
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">Search</Button>
                </div>
              </div>
              <Toggle
                checked={matchMine}
                onChange={setMatchMine}
                label="Match my profile"
                description={
                  profile?.grade || profile?.school || profile?.board
                    ? `Your class: ${profile?.grade ?? "—"} · school: ${profile?.school ?? "—"} · board: ${profile?.board ?? "—"}`
                    : "Set class, school and board on your account to enable matching."
                }
              />
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No books match your filters"
              description="Try clearing the class, school or board filters."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-lift"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#DC2626]" />
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.grade && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-[#DC2626]">
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
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-lg font-bold text-[#DC2626]">₹{item.price}</span>
                    <span className="text-xs text-slate-500">
                      {item.condition ? item.condition.replace("_", " ") : ""}
                      {item.sellerName ? ` · ${item.sellerName}` : ""}
                    </span>
                  </div>
                  <div className="mt-2 rounded-lg bg-slate-50/70 p-2.5 text-xs text-slate-600 space-y-1">
                    {item.sellerPhone && (
                      <p className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{item.sellerPhone}</p>
                    )}
                    {item.location && (
                      <p className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</p>
                    )}
                    <p>
                      Posted: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      Seller rating: {sellerStats[item.sellerId]?.average ?? 0} ({sellerStats[item.sellerId]?.count ?? 0})
                    </p>
                  </div>

                  {user && user.uid !== item.sellerId && (
                    <div className="mt-2">
                      {reviewingSellerId === item.sellerId ? (
                        <div className="space-y-2 rounded-lg border border-slate-200 p-2.5">
                          <Input
                            label="Your Rating (1-5)"
                            value={sellerRating}
                            onChange={(e) => setSellerRating(e.target.value.replace(/[^1-5]/g, "") || "5")}
                          />
                          <textarea
                            value={sellerComment}
                            onChange={(e) => setSellerComment(e.target.value)}
                            rows={2}
                            placeholder="Write your review"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void handleSellerReview(item.sellerId)}>
                              Submit Review
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setReviewingSellerId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setReviewingSellerId(item.sellerId)}>
                          Add Seller Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}