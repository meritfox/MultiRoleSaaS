"use client";

import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      <Navbar title={title} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {/* Extra bottom padding on mobile so content clears the tab bar */}
          <div className="container mx-auto px-4 py-6 pb-24 lg:py-8 lg:pb-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <MobileNav
        open={mobileNavOpen}
        onOpen={() => setMobileNavOpen(true)}
        onClose={() => setMobileNavOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
