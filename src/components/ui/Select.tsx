import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
}

/** Styled native select matching the admin design system. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          className={cn(
            "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-3 pr-9 text-sm font-medium text-slate-700",
            "transition-all duration-200 hover:border-slate-300 focus:border-[#DC2626]/40 focus:bg-white focus:outline-none focus:shadow-glow",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
