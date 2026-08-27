import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  /** Tailwind classes for the icon tile, e.g. "bg-[#EEF2FF] text-[#DC2626]". */
  iconClassName?: string;
  /** Trend tag, e.g. "+12.4% vs last mo". */
  trend?: {
    label: string;
    direction: "up" | "down";
    /** Whether the trend direction is good news (green) or bad (red). */
    positive?: boolean;
  };
  subtext?: string;
  className?: string;
}

/** Rich KPI tile: icon, metric value, trend tag, and supporting sub-text. */
export function KpiCard({ label, value, icon, iconClassName, trend, subtext, className }: KpiCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-soft", iconClassName)}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.positive !== false ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"
            )}
          >
            {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.label}
          </span>
        )}
        {subtext && <span className="text-xs text-slate-500">{subtext}</span>}
      </div>
    </Card>
  );
}
