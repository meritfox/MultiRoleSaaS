"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, UserCircle, LogOut, X, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/lib/auth-utils";
import { getNavItems, getMobileTabItems } from "./nav-items";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const isItemActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

/**
 * Mobile navigation for dashboard pages:
 *  - a slide-over drawer with the full role-based nav list, and
 *  - a fixed bottom tab bar with the primary destinations + a "Menu" tab
 *    that opens the drawer.
 * Both are only rendered below the `lg` breakpoint (the desktop sidebar
 * takes over from `lg` upwards).
 */
export function MobileNav({ open, onOpen, onClose }: MobileNavProps) {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getNavItems(role);
  const tabItems = getMobileTabItems(role);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while the drawer is open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const handleLogout = async () => {
    onClose();
    await logout();
    // Replace so the Back button cannot return to a protected dashboard.
    router.replace("/");
  };

  return (
    <>
      {/* ---- Slide-over drawer ---- */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm animate-slide-in-right flex-col bg-white shadow-lift">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-soft">
                  <GraduationCap className="h-5 w-5 text-white" />
                </span>
                <span className="text-lg font-bold text-slate-900">
                  Omni<span className="text-[#DC2626]">Stud</span>
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              {navItems.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#DC2626]/10 text-[#DC2626]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", active ? "text-[#DC2626]" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User card + logout */}
            <div className="border-t border-slate-100 p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ef4444] to-[#B91C1C] text-sm font-medium text-white">
                  {user?.displayName?.charAt(0).toUpperCase() || <UserCircle className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{user?.displayName}</p>
                  <p className="truncate text-xs capitalize text-slate-500">
                    {role?.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Bottom tab bar ---- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {tabItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-[#DC2626]" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
              open ? "text-[#DC2626]" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
        </div>
      </nav>
    </>
  );
}