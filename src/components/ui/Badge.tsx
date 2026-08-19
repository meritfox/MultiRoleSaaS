import * as React from "react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/lib/utils";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-[#ECFDF5] text-[#047857]",
  warning: "bg-[#FFFBEB] text-[#B45309]",
  danger: "bg-[#FEF2F2] text-[#B91C1C]",
  indigo: "bg-[#EEF2FF] text-[#4338CA]",
  purple: "bg-purple-50 text-purple-700",
  slate: "bg-slate-100 text-slate-600",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Renders a small status dot before the label. */
  dot?: boolean;
}

/** Soft-tinted status pill used for roles, escrow states, and account status. */
export function Badge({ variant = "slate", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
