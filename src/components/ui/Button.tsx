import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, asChild, children, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-b from-[#ef4444] to-[#DC2626] text-white hover:to-[#B91C1C] shadow-soft hover:shadow-lift",
      secondary: "bg-gradient-to-b from-slate-500 to-slate-600 text-white hover:to-slate-700 shadow-soft hover:shadow-lift",
      outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-soft",
      ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
      danger: "bg-gradient-to-b from-red-500 to-red-600 text-white hover:to-red-700 shadow-soft hover:shadow-lift",
      success: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:to-emerald-700 shadow-soft hover:shadow-lift",
      warning: "bg-gradient-to-b from-amber-400 to-amber-500 text-white hover:to-amber-600 shadow-soft hover:shadow-lift",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      icon: "p-2",
    };

    const combinedClassName = cn(
      "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
      variants[variant],
      sizes[size],
      className
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        className: cn(combinedClassName, child.props.className),
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
