"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth-utils";
import { LogOut, User, Menu, X, Bell, Settings, ChevronDown } from "lucide-react";

interface NavbarProps {
  title?: string;
  showNav?: boolean;
}

const Navbar = ({ title, showNav = true }: NavbarProps) => {
  const { user, role, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const getDashboardLink = () => {
    if (role === "SUPER_ADMIN") return "/admin/dashboard";
    if (role === "SERVICE_PROVIDER") return "/provider/dashboard";
    if (role === "STUDENT") return "/student/dashboard";
    if (role === "PARENT") return "/parent/dashboard";
    return "/";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href={getDashboardLink()} className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6]">
              <span className="text-lg font-bold text-white">O</span>
            </div>
            <span className="text-xl font-bold text-[#3b4cca]">OmniStud</span>
          </Link>
          {title && (
            <>
              <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden sm:block" />
              <h1 className="text-sm font-medium text-slate-500 hidden sm:block">
                {title}
              </h1>
            </>
          )}
        </div>

        {showNav && (
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6] flex items-center justify-center text-white font-medium">
                    {user.displayName?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-900">{user.displayName}</span>
                    <span className="text-xs text-slate-500 capitalize">{role?.toLowerCase().replace("_", " ")}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {showNav && (
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {showNav && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6] flex items-center justify-center text-white font-medium">
                  {user.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user.displayName}</p>
                  <p className="text-xs text-slate-500 capitalize">{role?.toLowerCase().replace("_", " ")}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={getDashboardLink()}>
                  <User className="mr-2 h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </Button>
              <Button variant="danger" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
