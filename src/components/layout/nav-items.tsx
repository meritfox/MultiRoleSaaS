import {
  LayoutDashboard,
  Search,
  Bus,
  ShoppingCart,
  Briefcase,
  CreditCard,
  Gift,
  MapPin,
  UserCircle,
  Users,
  Settings,
  BarChart3,
  Wallet,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Full navigation list per role (sidebar + mobile drawer). */
export function getNavItems(role: UserRole | null): NavItem[] {
  if (role === "STUDENT") {
    return [
      { label: "Home", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Find Tutors", href: "/student/dashboard/tutors", icon: Search },
      { label: "School Transport", href: "/student/dashboard/transport", icon: Bus },
      { label: "Marketplace", href: "/student/dashboard/marketplace", icon: ShoppingCart },
      { label: "Job Board", href: "/student/dashboard/jobs", icon: Briefcase },
      { label: "Payments", href: "/student/dashboard/payments", icon: CreditCard },
      { label: "Rewards", href: "/student/dashboard/rewards", icon: Gift },
      { label: "GPS Tracking", href: "/student/dashboard/tracking", icon: MapPin },
      { label: "Account", href: "/student/dashboard/account", icon: UserCircle },
    ];
  }

  if (role === "PARENT") {
    return [
      { label: "Family Overview", href: "/parent/dashboard", icon: LayoutDashboard },
      { label: "Live Map", href: "/parent/dashboard/live-map", icon: MapPin },
      { label: "Tracked Services", href: "/parent/dashboard/services", icon: Bus },
      { label: "Payments", href: "/parent/dashboard/payments", icon: CreditCard },
      { label: "Account", href: "/parent/dashboard/account", icon: UserCircle },
    ];
  }

  if (role === "SERVICE_PROVIDER") {
    return [
      { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
      { label: "My Services", href: "/provider/dashboard/services", icon: Briefcase },
      { label: "Requests", href: "/provider/dashboard/requests", icon: Users },
      { label: "Earnings", href: "/provider/dashboard/earnings", icon: Wallet },
      { label: "Transport Console", href: "/provider/dashboard/transport", icon: Bus },
      { label: "GPS Check-in", href: "/provider/dashboard/checkin", icon: MapPin },
      { label: "Profile", href: "/provider/dashboard/profile", icon: UserCircle },
    ];
  }

  if (role === "SUPER_ADMIN") {
    return [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "User Management", href: "/admin/dashboard/users", icon: Users },
      { label: "Subscription Plans", href: "/admin/dashboard/subscriptions", icon: CreditCard },
      { label: "Escrow & Commissions", href: "/admin/dashboard/escrow", icon: Wallet },
      { label: "Site Settings", href: "/admin/dashboard/settings", icon: Settings },
      { label: "System Reports", href: "/admin/dashboard/reports", icon: BarChart3 },
      { label: "Activity Logs", href: "/admin/dashboard/logs", icon: FileText },
    ];
  }

  return [{ label: "Home", href: "/", icon: LayoutDashboard }];
}

/** Primary destinations for the mobile bottom tab bar (a "Menu" tab is appended by the tab bar itself). */
export function getMobileTabItems(role: UserRole | null): NavItem[] {
  if (role === "STUDENT") {
    return [
      { label: "Home", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Tutors", href: "/student/dashboard/tutors", icon: Search },
      { label: "Market", href: "/student/dashboard/marketplace", icon: ShoppingCart },
      { label: "Jobs", href: "/student/dashboard/jobs", icon: Briefcase },
    ];
  }

  if (role === "PARENT") {
    return [
      { label: "Home", href: "/parent/dashboard", icon: LayoutDashboard },
      { label: "Live Map", href: "/parent/dashboard/live-map", icon: MapPin },
      { label: "Payments", href: "/parent/dashboard/payments", icon: CreditCard },
      { label: "Account", href: "/parent/dashboard/account", icon: UserCircle },
    ];
  }

  if (role === "SERVICE_PROVIDER") {
    return [
      { label: "Home", href: "/provider/dashboard", icon: LayoutDashboard },
      { label: "Services", href: "/provider/dashboard/services", icon: Briefcase },
      { label: "Requests", href: "/provider/dashboard/requests", icon: Users },
      { label: "Earnings", href: "/provider/dashboard/earnings", icon: Wallet },
    ];
  }

  if (role === "SUPER_ADMIN") {
    return [
      { label: "Home", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/dashboard/users", icon: Users },
      { label: "Plans", href: "/admin/dashboard/subscriptions", icon: CreditCard },
      { label: "Reports", href: "/admin/dashboard/reports", icon: BarChart3 },
    ];
  }

  return [{ label: "Home", href: "/", icon: LayoutDashboard }];
}

export function getDashboardLink(role: UserRole | null | undefined): string {
  if (role === "SUPER_ADMIN") return "/admin/dashboard";
  if (role === "SERVICE_PROVIDER") return "/provider/dashboard";
  if (role === "STUDENT") return "/student/dashboard";
  if (role === "PARENT") return "/parent/dashboard";
  return "/";
}
