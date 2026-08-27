"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Bus, MapPin, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  /** Max width of the form column, e.g. "max-w-md" or "max-w-2xl". */
  maxWidth?: string;
  /** Optional content rendered in the brand panel headline area. */
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
}

const highlights = [
  { icon: GraduationCap, label: "Students, parents, tutors & transporters in one place" },
  { icon: Bus, label: "Live GPS school transport, tracked end-to-end" },
  { icon: MapPin, label: "Tutors and services across 120+ cities" },
  { icon: ShieldCheck, label: "Secure payments with escrow protection" },
];

/**
 * Shared auth layout: dark brand panel (Mygate-style) on the left,
 * and the form canvas on the right. On mobile the panel collapses to a
 * compact brand header.
 */
export function AuthShell({
  children,
  maxWidth = "max-w-md",
  eyebrow = "OmniStud",
  title = (
    <>
      Bridging the{" "}
      <span className="bg-gradient-to-r from-[#ffc529] to-[#ffe08a] bg-clip-text text-transparent">
        education ecosystem
      </span>
    </>
  ),
  description = "One platform connecting learners, parents, educators and transport — so every school day runs smoother.",
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[#0b1e3a]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden p-12 lg:flex xl:w-1/2">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#DC2626]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-[440px] w-[440px] rounded-full bg-[#5a63e8]/25 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-56 w-56 rounded-full bg-[#ffc529]/15 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-lift">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold text-white">
            Omni<span className="text-[#ffc529]">Stud</span>
          </span>
        </Link>

        <div className="relative max-w-lg">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc529]">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            {description}
          </p>

          <ul className="mt-9 space-y-4">
            {highlights.map((h) => (
              <li key={h.label} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#ffc529]">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Trusted by 50K+ learners & 500+ institutions across India
        </p>
      </aside>

      {/* Form canvas */}
      <main className="relative flex flex-1 items-center justify-center overflow-y-auto bg-[#f4f4f2] px-4 py-10 sm:px-8">
        {/* subtle ambient tint */}
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[#DC2626]/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#0b1e3a]/[0.05] blur-3xl" />

        <div className={`relative w-full ${maxWidth} animate-fade-up`}>
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-soft">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold text-slate-900">
              Omni<span className="text-[#DC2626]">Stud</span>
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
