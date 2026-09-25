"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Bus, MapPin, Users, Compass, ShieldCheck } from "lucide-react";

interface TransportDemandWidgetProps {
  schoolName?: string;
  cityArea?: string;
  childrenLookingCount?: number;
  operatorCount?: number;
}

export function TransportDemandWidget({
  schoolName = "DAV Public School",
  cityArea = "Bistupur",
  childrenLookingCount = 8,
  operatorCount = 3,
}: TransportDemandWidgetProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#DC2626]/20 bg-gradient-to-br from-red-50/40 via-amber-50/30 to-white p-5 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DC2626]/10 text-[#DC2626]">
              <Compass className="h-3 w-3" /> Transport Demand Hub
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="h-3 w-3" /> OmniStud Verified Transporters
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Looking for School Transport?
          </h3>
          <p className="text-xs text-slate-600 max-w-xl">
            We found transport demand and operators around your school route. Transporters are verified by OmniStud before appearing on your route.
          </p>
        </div>

        <Button asChild size="sm">
          <Link href="/parent/dashboard/transport">
            <Compass className="h-4 w-4 mr-1.5" /> Explore Transport
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{schoolName}</p>
            <p className="text-[11px] text-slate-500 truncate">📍 {cityArea}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">
              👨‍🎓 {childrenLookingCount} children
            </p>
            <p className="text-[11px] text-slate-500">looking for transport</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Bus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">
              🚍 {operatorCount} operators
            </p>
            <p className="text-[11px] text-slate-500">serving nearby areas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

