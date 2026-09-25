"use client";

import React from "react";
import Link from "next/link";
import { StudentProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { Bus, MapPin, Clock, ExternalLink } from "lucide-react";

interface ChildCardProps {
  child: StudentProfile;
  hasTransport?: boolean;
  busRoute?: string;
  driverName?: string;
  pickupTime?: string;
  pickupLocation?: string;
  onViewChild?: (child: StudentProfile) => void;
}

export function ChildCard({
  child,
  hasTransport = true,
  busRoute = "Route R-12",
  pickupTime = "7:20 AM",
  pickupLocation = "Bistupur",
  onViewChild,
}: ChildCardProps) {
  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft hover:shadow-lift transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#ef4444] to-[#B91C1C] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {child.displayName?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {child.displayName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {child.grade || "Class 6"} · {child.school || "DAV Public School"}
              </p>
              {child.studentIdCode && (
                <span className="inline-block mt-1 text-[11px] font-mono text-slate-400">
                  ID: {child.studentIdCode}
                </span>
              )}
            </div>
          </div>

          <div>
            {hasTransport ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Transport Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                No Transport
              </span>
            )}
          </div>
        </div>

        {/* Transport quick details */}
        {hasTransport ? (
          <div className="rounded-xl bg-slate-50/80 p-3 my-3 space-y-1.5 text-xs text-slate-700 border border-slate-100">
            <div className="flex items-center gap-2">
              <Bus className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="font-medium">Bus:</span> {busRoute}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
              <span className="font-medium">Pickup:</span> {pickupLocation}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="font-medium">Pickup Time:</span> {pickupTime}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50/70 p-3 my-3 text-xs text-amber-800 border border-amber-100/80">
            <p className="font-medium">No school transport assigned yet.</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Explore nearby verified bus operators.</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
        {hasTransport && (
          <Button asChild size="sm" variant="outline" className="flex-1 text-xs">
            <Link href="/parent/dashboard/live-map">
              <Bus className="h-3.5 w-3.5 mr-1 text-amber-600" /> Track Bus
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => onViewChild?.(child)}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Child
        </Button>
      </div>
    </div>
  );
}

