import * as React from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

/** Circular avatar with photo support and an initials fallback. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const base = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
    sizeClasses[size],
    className
  );

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={cn(base, "object-cover")} referrerPolicy="no-referrer" />
    );
  }

  return (
    <span className={cn(base, "bg-gradient-to-br from-[#ef4444] to-[#B91C1C] text-white")}>
      {getInitials(name || "?")}
    </span>
  );
}
