import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA linking to a relevant page. */
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/** Consistent empty-state block rendered whenever a list has no results. */
export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white px-6 py-12 text-center shadow-soft",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#ef4444] to-[#DC2626] px-4 py-2 text-sm font-medium text-white shadow-soft transition-all hover:to-[#B91C1C]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
