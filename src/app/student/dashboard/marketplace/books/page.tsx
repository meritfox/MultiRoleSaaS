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
import { getMarketplaceItems } from "@/lib/services/marketplace";
import { getUserById } from "@/lib/services/users";
import { MarketplaceItem, StudentProfile } from "@/types";
import { BookOpen } from "lucide-react";

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

  useEffect(() => {
    if (!user) return;
    Promise.all([getMarketplaceItems(), getUserById(user.uid).catch(() => null)])
      .then(([all, prof]) => {
        setItems(all.filter((i) => i.category === "BOOK"));
        setProfile(prof as StudentProfile | null);
      })
      .catch((err) => console.error("Failed to load books:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    const needle = (v: string) => v.trim().toLowerCase();
    return items.filter((i) => {
      if (matchMine && profile) {
        if (
          (profile.grade && i.grade === profile.grade) ||
          (profile.school && i.school && i.school.toLowerCase() === profile.school.toLowerCase()) ||
          (profile.board && i.board && i.board.toLowerCase() === profile.board.toLowerCase())
        ) {
          return true;
        }
        return false;
      }
      if (needle(grade) && !(i.grade ?? "").toLowerCase().includes(needle(grade))) return false;
      if (needle(school) && !(i.school ?? "").toLowerCase().includes(needle(school))) return false;
      if (needle(board) && !(i.board ?? "").toLowerCase().includes(needle(board))) return false;
      return true;
    });
  }, [items, grade, school, board, matchMine, profile]);

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sell Your Old Books</h2>
              <p className="text-sm text-slate-500">
                Match books by class, school and board.
              </p>
            </div>
            <Link
              href="/student/dashboard/marketplace/new"
              className="rounded-lg bg-[#DC2626] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B91C1C]"
            >
              Post a Book
            </Link>
          </div>

          <Card title="Matching Filters">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Class" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 5" />
                <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Don Bosco" />
                <Input label="Board" value={board} onChange={(e) => setBoard(e.target.value)} placeholder="e.g. CBSE" />
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
            <Card>
              <p className="text-center text-slate-500 py-8">No books match your filters.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-xl border border-slate-200/60 bg-white p-4 shadow-soft transition-all duration-200 hover:shadow-lift"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}