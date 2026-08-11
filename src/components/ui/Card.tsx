import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  noPadding?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, description, noPadding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-shadow hover:shadow-md",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
            {title && (
              <h3 className="text-xl font-semibold leading-none tracking-tight text-slate-900">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
        )}
        {children && (
          <div className={cn(!noPadding && (title || description ? "p-6" : "p-6"))}>
            {children}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
