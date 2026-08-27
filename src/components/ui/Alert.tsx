import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "warning" | "info";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", ...props }, ref) => {
    const variants = {
      success: "bg-emerald-50/80 text-emerald-800 border-emerald-200/70",
      error: "bg-red-50/80 text-red-800 border-red-200/70",
      warning: "bg-amber-50/80 text-amber-800 border-amber-200/70",
      info: "bg-slate-50/80 text-slate-700 border-slate-200/70",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border p-4 text-sm leading-relaxed",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Alert.displayName = "Alert";

export { Alert };