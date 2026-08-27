"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f4f2] px-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#DC2626]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#0b1e3a]/[0.06] blur-3xl" />
      <Card className="relative w-full max-w-md text-center animate-fade-up">
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-soft">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Access Denied</h2>
            <p className="text-sm text-slate-600">
              You do not have permission to access this page.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}