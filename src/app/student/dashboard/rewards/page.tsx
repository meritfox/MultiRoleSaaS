"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  getReferralCode,
  getReferralLink,
  getMyReferrals,
  submitFeedback,
  getMyFeedback,
  getMyContestEntries,
  currentContestMonth,
} from "@/lib/services/engagement";
import { Referral, FeedbackEntry, ContestEntry } from "@/types";
import { Copy, Check, Star, Trophy, Ticket, Users, IndianRupee } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

const REFERRAL_STATUS_VARIANT: Record<Referral["status"], "warning" | "indigo" | "success"> = {
  PENDING: "warning",
  SIGNED_UP: "indigo",
  PAID: "success",
};

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

export default function StudentRewardsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [entries, setEntries] = useState<ContestEntry[]>([]);

  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const month = currentContestMonth();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [refs, fb, ce] = await Promise.all([
          getMyReferrals(user.uid),
          getMyFeedback(user.uid),
          getMyContestEntries(user.uid, month),
        ]);
        setReferrals(refs);
        setFeedbackList(fb);
        setEntries(ce);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, month]);

  const referralLink = user ? getReferralLink(user.uid) : "";
  const referralCode = user ? getReferralCode(user.uid) : "";
  const totalEarned = referrals
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + r.commission, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link. Please copy it manually.");
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setSending(true);
    setError(null);
    setFeedbackSuccess(false);
    try {
      const fb = await submitFeedback(user.uid, {
        message: message.trim(),
        rating,
        userName: user.displayName,
      });
      setFeedbackList([fb, ...feedbackList]);
      // Refresh entries so the new coupon shows up immediately.
      setEntries(await getMyContestEntries(user.uid, month));
      setMessage("");
      setRating(5);
      setFeedbackSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSending(false);
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
      <DashboardLayout title="Engagement & Rewards">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Engagement & Rewards</h2>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-[#DC2626]"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Referrals</p>
                  <p className="text-xl font-bold text-slate-900">{referrals.length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><IndianRupee className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Rewards Earned</p>
                  <p className="text-xl font-bold text-slate-900">₹{totalEarned}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><Ticket className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-slate-500">Coupons this month</p>
                  <p className="text-xl font-bold text-slate-900">{entries.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Screen 22: Refer & Earn */}
          <Card
            title="Refer & Earn"
            description="Share your unique link. You earn commission when friends join OmniStud."
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                  {referralLink}
                </div>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Your referral code: <span className="font-mono font-medium text-slate-700">{referralCode}</span>
              </p>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Commission tracker</p>
                {referrals.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-500">
                    No referrals yet. Share your link to start earning.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {r.refereeName || r.refereeEmail || "New member"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900">₹{r.commission}</span>
                          <Badge variant={REFERRAL_STATUS_VARIANT[r.status]} dot>
                            {r.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Screen 23: Feedback / Suggestions & Prize Entry */}
          <Card
            title="Feedback & Suggestions"
            description="Every feedback submission earns you one coupon in the monthly prize draw."
          >
            {feedbackSuccess && (
              <Alert variant="success" className="mb-4">
                Thank you for your feedback! One coupon has been added to the {monthLabel(month)} prize draw.
              </Alert>
            )}
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Rate your experience</label>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`Rate ${value} out of 5`}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Your feedback or suggestion</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Please add weekend doubt-clearing sessions."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <Button type="submit" isLoading={sending} disabled={!message.trim()} className="w-full">
                Submit Feedback & Enter Draw
              </Button>
            </form>

            {feedbackList.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-slate-700">My previous feedback</p>
                <div className="space-y-2">
                  {feedbackList.map((f) => (
                    <div key={f.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {f.rating ?? "-"}/5
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-700">{f.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Screen 24: Monthly Prize Contest & Coupon Draw */}
          <Card
            title={`${monthLabel(month)} Prize Contest`}
            description="Winners are picked in a monthly coupon draw from all eligible entries."
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#DC2626] to-[#ef4444] p-4 text-white">
                <Trophy className="h-8 w-8 shrink-0" />
                <div>
                  <p className="font-semibold">You have {entries.length} coupon{entries.length === 1 ? "" : "s"} in this month&apos;s draw</p>
                  <p className="text-xs text-red-100">
                    Earn more coupons by submitting feedback and staying active.
                  </p>
                </div>
              </div>

              {entries.length === 0 ? (
                <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-500">
                  No coupons yet this month. Submit feedback above to enter the draw.
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm"
                    >
                      <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                        <Ticket className="h-4 w-4 text-[#DC2626]" />
                        Coupon #{entries.length - index}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
