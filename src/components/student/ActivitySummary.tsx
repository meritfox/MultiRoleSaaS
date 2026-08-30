"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import TransportMap, { MapMarker } from "@/components/map/TransportMap";
import {
  subscribeToLiveLocation,
  getLiveLocation,
  LiveLocation,
} from "@/lib/services/transport";
import { formatRelativeTime, requestStatusVariant } from "@/lib/utils";
import {
  Service,
  ServiceRequest,
  MarketplaceItem,
  Job,
  EscrowTransaction,
} from "@/types";
import {
  GraduationCap,
  Bus,
  Star,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

/** A service request joined with its service document (as returned by getRequestsByStudent). */
export type StudentRequest = ServiceRequest & { service?: Service };

interface ActivitySummaryProps {
  userName: string;
  requests: StudentRequest[];
  marketplaceItems: MarketplaceItem[];
  jobs: Job[];
  escrowTransactions: EscrowTransaction[];
}

const REQUEST_LABELS: Record<ServiceRequest["status"], string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** Small labelled panel used by every widget in the rail. */
function Widget({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-soft">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-slate-50/80 px-3 py-4 text-center text-xs text-slate-500">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Your Learning Path — derived from approved tutoring/institution requests.
// ---------------------------------------------------------------------------
function LearningPathWidget({ requests }: { requests: StudentRequest[] }) {
  const learning = requests.filter(
    (r) =>
      r.status === "APPROVED" &&
      (r.service?.providerType === "TEACHER" || r.service?.providerType === "INSTITUTION")
  );

  return (
    <Widget title="Your Learning Path">
      {learning.length === 0 ? (
        <EmptyNote>
          No active tutoring yet.{" "}
          <Link href="/student/dashboard/tutors" className="font-medium text-[#DC2626] hover:underline">
            Find a tutor
          </Link>{" "}
          to get started.
        </EmptyNote>
      ) : (
        <ul className="space-y-2.5">
          {learning.slice(0, 3).map((r) => (
            <li key={r.id}>
              <Link
                href="/student/dashboard/tutors"
                className="group flex items-center gap-3 rounded-xl bg-slate-50/70 p-2.5 transition-colors hover:bg-slate-100/70"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DC2626]/10 text-[#DC2626]">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {r.service?.subject ?? r.service?.name ?? "Class"}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {r.service?.name} - <span className="font-medium text-emerald-600">Active</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#DC2626]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Connected Fleet — mini map of the student's approved transporters.
// ---------------------------------------------------------------------------
function ConnectedFleetWidget({ requests }: { requests: StudentRequest[] }) {
  const fleet = requests.filter(
    (r) => r.status === "APPROVED" && r.service?.providerType === "TRANSPORTER"
  );
  const [locations, setLocations] = useState<Record<string, LiveLocation | null>>({});

  // Subscribe to each approved transporter's live location.
  useEffect(() => {
    const unsubs = fleet.map((r) =>
      subscribeToLiveLocation(r.providerId, (loc) => {
        setLocations((prev) => ({ ...prev, [r.providerId]: loc }));
      })
    );
    // Seed with current values for providers that have no live doc yet.
    fleet.forEach((r) => {
      getLiveLocation(r.providerId)
        .then((loc) => setLocations((prev) => ({ ...prev, [r.providerId]: loc })))
        .catch(() => undefined);
    });
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  const markers: MapMarker[] = fleet
    .map((r) => locations[r.providerId])
    .filter((l): l is LiveLocation => !!l)
    .map((l, i) => ({
      id: `${l.providerId}-${i}`,
      lat: l.lat,
      lng: l.lng,
      label: "Your transport",
      emoji: "\u{1F68C}",
    }));

  return (
    <Widget title="Connected Fleet">
      {fleet.length === 0 ? (
        <EmptyNote>
          No transport linked yet.{" "}
          <Link href="/student/dashboard/transport" className="font-medium text-[#DC2626] hover:underline">
            Browse school transport
          </Link>{" "}
          and request a route.
        </EmptyNote>
      ) : (
        <div className="space-y-3">
          <TransportMap
            markers={markers}
            className="h-40 w-full overflow-hidden rounded-xl border border-slate-200/60"
          />
          <ul className="space-y-2">
            {fleet.map((r) => {
              const live = locations[r.providerId];
              const onboard = !!live?.active;
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Bus className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {r.service?.name ?? "Transport"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {onboard ? "Onboard" : "Awaiting Pick-up"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      onboard ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Market & Job Board Opportunities — latest marketplace items + open jobs.
// ---------------------------------------------------------------------------
function MarketJobsWidget({
  marketplaceItems,
  jobs,
}: {
  marketplaceItems: MarketplaceItem[];
  jobs: Job[];
}) {
  return (
    <Widget title="Market & Job Board Opportunities">
      {marketplaceItems.length === 0 && jobs.length === 0 ? (
        <EmptyNote>No new listings right now. Check back soon.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {marketplaceItems.slice(0, 2).map((item) => (
            <Link
              key={item.id}
              href="/student/dashboard/marketplace"
              className="group flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5 transition-colors hover:bg-slate-100/70"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.category}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-[#DC2626]">₹{item.price}</span>
            </Link>
          ))}
          {jobs.slice(0, 1).map((job) => (
            <div key={job.id} className="rounded-xl border border-slate-200/60 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{job.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {job.posterName ?? "Job"}{job.location ? ` - ${job.location}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{formatRelativeTime(job.createdAt)}</span>
                <Link
                  href="/student/dashboard/jobs"
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-b from-[#ef4444] to-[#DC2626] px-2.5 py-1 text-xs font-medium text-white shadow-soft transition-all hover:to-[#B91C1C]"
                >
                  Apply Now <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Live GPS — vehicle info cards for approved transporters.
// ---------------------------------------------------------------------------
function LiveGpsWidget({ requests }: { requests: StudentRequest[] }) {
  const fleet = requests.filter(
    (r) => r.status === "APPROVED" && r.service?.providerType === "TRANSPORTER"
  );

  return (
    <Widget title="Live GPS">
      <p className="mb-3 text-xs text-slate-500">
        Real-time route tracking details and route analysis.
      </p>
      {fleet.length === 0 ? (
        <EmptyNote>Link a transport service to see live vehicle info.</EmptyNote>
      ) : (
        <ul className="space-y-2.5">
          {fleet.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DC2626]/10 text-[#DC2626]">
                  <Bus className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {r.service?.vehicleType ?? r.service?.name ?? "Vehicle"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {r.service?.vehicleType ? "Vehicle Type" : r.service?.name ?? "Transport"}
                  </p>
                </div>
              </div>
              {r.service?.rating !== undefined && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-slate-700">{r.service.rating}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Request History — latest requests + most recent escrow confirmation.
// ---------------------------------------------------------------------------
function RequestHistoryWidget({
  requests,
  escrowTransactions,
}: {
  requests: StudentRequest[];
  escrowTransactions: EscrowTransaction[];
}) {
  const recent = [...requests].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const latestEscrow = escrowTransactions[0];

  return (
    <Widget title="Request History">
      <p className="mb-3 text-xs text-slate-500">Your most recent service requests.</p>
      {recent.length === 0 ? (
        <EmptyNote>No requests yet — request a tutor or transport to see them here.</EmptyNote>
      ) : (
        <ul className="space-y-2">
          {recent.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {r.service?.name ?? "Service request"}
                </p>
                <p className="text-xs text-slate-500">{formatRelativeTime(r.createdAt)}</p>
              </div>
              <Badge variant={requestStatusVariant(r.status)}>{REQUEST_LABELS[r.status]}</Badge>
            </li>
          ))}
        </ul>
      )}

      {latestEscrow && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-800">Escrow Confirmation</p>
            <p className="text-xs leading-5 text-emerald-700">
              Payment for {latestEscrow.serviceName} (₹{latestEscrow.amount}) is{" "}
              {latestEscrow.status.toLowerCase()} in escrow.
            </p>
          </div>
        </div>
      )}
    </Widget>
  );
}

/**
 * Right-hand "Activity Summary" rail for the student dashboard.
 * Stacks below the main content on mobile.
 */
export function ActivitySummary({
  userName,
  requests,
  marketplaceItems,
  jobs,
  escrowTransactions,
}: ActivitySummaryProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">
        {userName} - Activity Summary
      </h2>
      <LearningPathWidget requests={requests} />
      <ConnectedFleetWidget requests={requests} />
      <MarketJobsWidget marketplaceItems={marketplaceItems} jobs={jobs} />
      <LiveGpsWidget requests={requests} />
      <RequestHistoryWidget requests={requests} escrowTransactions={escrowTransactions} />
    </div>
  );
}
