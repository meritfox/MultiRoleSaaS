"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Table footer pagination: "Showing 1-10 of N" + numbered controls. */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = React.useMemo(() => {
    const list: number[] = [];
    for (let p = 1; p <= pageCount; p++) {
      if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) list.push(p);
    }
    return list;
  }, [page, pageCount]);

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-900">{start}</span>-
        <span className="font-medium text-slate-900">{end}</span> of{" "}
        <span className="font-medium text-slate-900">{total.toLocaleString("en-IN")}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>

        {pages.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span className="px-1 text-sm text-slate-400">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                p === page
                  ? "bg-[#DC2626] text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          </React.Fragment>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
