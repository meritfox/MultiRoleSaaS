import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(timestamp);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** "Aug 14, 26" style short date for dense tables. */
export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(new Date(timestamp));
}

/** Formats raw enum values into readable labels, e.g. SERVICE_PROVIDER -> "Service Provider". */
export function formatRole(role?: string): string {
  if (!role) return "Unknown";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export type BadgeVariant = "success" | "warning" | "danger" | "indigo" | "purple" | "slate";

/** Soft-tint badge variant for each platform role. */
export function roleBadgeVariant(role?: string): BadgeVariant {
  switch (role) {
    case "STUDENT":
      return "indigo";
    case "PARENT":
      return "purple";
    case "TRANSPORTER":
      return "success";
    case "TEACHER":
      return "warning";
    case "SERVICE_PROVIDER":
      return "slate";
    case "SUPER_ADMIN":
      return "danger";
    default:
      return "slate";
  }
}

/** Soft-tint badge variant for escrow transaction states. */
export function escrowStatusVariant(status?: string): BadgeVariant {
  switch (status) {
    case "RELEASED":
      return "success";
    case "HELD":
      return "warning";
    case "REFUNDED":
      return "danger";
    default:
      return "slate";
  }
}

/** Month-over-month percentage change; returns null when there is no prior baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
