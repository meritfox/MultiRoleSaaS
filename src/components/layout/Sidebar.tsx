"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
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
  Shield,
  Wallet,
  FileText,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/auth-utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const Sidebar = () => {
  const { role, user } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const getNavItems = (): NavItem[] => {
    const common: NavItem[] = [
      { label: "Home", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    ];

    if (role === "STUDENT") {
      return [
        { label: "Home", href: "/student/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Find Tutors", href: "/student/dashboard/tutors", icon: <Search className="h-5 w-5" /> },
        { label: "School Transport", href: "/student/dashboard/transport", icon: <Bus className="h-5 w-5" /> },
        { label: "Marketplace", href: "/student/dashboard/marketplace", icon: <ShoppingCart className="h-5 w-5" /> },
        { label: "Job Board", href: "/student/dashboard/jobs", icon: <Briefcase className="h-5 w-5" /> },
        { label: "Payments", href: "/student/dashboard/payments", icon: <CreditCard className="h-5 w-5" /> },
        { label: "Rewards", href: "/student/dashboard/rewards", icon: <Gift className="h-5 w-5" /> },
        { label: "GPS Tracking", href: "/student/dashboard/tracking", icon: <MapPin className="h-5 w-5" /> },
        { label: "Account", href: "/student/dashboard/account", icon: <UserCircle className="h-5 w-5" /> },
      ];
    }

    if (role === "PARENT") {
      return [
        { label: "Family Overview", href: "/parent/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Live Map", href: "/parent/dashboard/live-map", icon: <MapPin className="h-5 w-5" /> },
        { label: "Tracked Services", href: "/parent/dashboard/services", icon: <Bus className="h-5 w-5" /> },
        { label: "Payments", href: "/parent/dashboard/payments", icon: <CreditCard className="h-5 w-5" /> },
        { label: "Account", href: "/parent/dashboard/account", icon: <UserCircle className="h-5 w-5" /> },
      ];
    }

    if (role === "SERVICE_PROVIDER") {
      return [
        { label: "Dashboard", href: "/provider/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "My Services", href: "/provider/dashboard/services", icon: <Briefcase className="h-5 w-5" /> },
        { label: "Requests", href: "/provider/dashboard/requests", icon: <Users className="h-5 w-5" /> },
        { label: "Earnings", href: "/provider/dashboard/earnings", icon: <Wallet className="h-5 w-5" /> },
        { label: "GPS Check-in", href: "/provider/dashboard/checkin", icon: <MapPin className="h-5 w-5" /> },
        { label: "Profile", href: "/provider/dashboard/profile", icon: <UserCircle className="h-5 w-5" /> },
      ];
    }

    if (role === "SUPER_ADMIN") {
      return [
        { label: "Overview", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "User Management", href: "/admin/dashboard/users", icon: <Users className="h-5 w-5" /> },
        { label: "Subscription Plans", href: "/admin/dashboard/subscriptions", icon: <CreditCard className="h-5 w-5" /> },
        { label: "Escrow & Commissions", href: "/admin/dashboard/escrow", icon: <Wallet className="h-5 w-5" /> },
        { label: "Site Settings", href: "/admin/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
        { label: "System Reports", href: "/admin/dashboard/reports", icon: <BarChart3 className="h-5 w-5" /> },
        { label: "Activity Logs", href: "/admin/dashboard/logs", icon: <FileText className="h-5 w-5" /> },
      ];
    }

    return common;
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200 bg-white">
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#3b4cca]/10 text-[#3b4cca]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6] flex items-center justify-center text-white font-medium text-sm">
            {user?.displayName?.charAt(0).toUpperCase() || <UserCircle className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName}</p>
            <p className="text-xs text-slate-500 capitalize truncate">{role?.toLowerCase().replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
