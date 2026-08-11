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
      success: "bg-green-50 text-green-800 border-green-200",
      error: "bg-red-50 text-red-800 border-red-200",
      warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
      info: "bg-blue-50 text-blue-800 border-blue-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md border p-4 text-sm",
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