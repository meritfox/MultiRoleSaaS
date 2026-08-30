"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FilterPillOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Pill-style single-select filter control (categories, provider types, etc.). */
export function FilterPills<T extends string>({ options, value, onChange, className }: FilterPillsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
              active
                ? "bg-gradient-to-b from-[#ef4444] to-[#DC2626] text-white shadow-soft"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            )}
          >
            {opt.icon}
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
