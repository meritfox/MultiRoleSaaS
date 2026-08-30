"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { UserCircle, LogOut } from "lucide-react";
import { logout } from "@/lib/auth-utils";
import { getNavItems } from "./nav-items";

const Sidebar = () => {
  const { role, user } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = getNavItems(role);

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200/60 bg-white/60 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto py-5 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#DC2626]/10 to-transparent text-[#DC2626] shadow-[inset_0_0_0_1px_rgba(220,38,38,0.08)]"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-soft"
                )}
              >
                {/* Left accent indicator for the active item */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#ef4444] to-[#DC2626] transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-30"
                  )}
                />
                <span className={cn(isActive ? "text-[#DC2626]" : "text-slate-400 group-hover:text-slate-600")}>
                  <item.icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-200/60">
        <div className="flex items-center gap-3 mb-4 rounded-xl bg-white p-2.5 shadow-soft">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ef4444] to-[#B91C1C] flex items-center justify-center text-white font-medium text-sm shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || <UserCircle className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName}</p>
            <p className="text-xs text-slate-500 capitalize truncate">{role?.toLowerCase().replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
