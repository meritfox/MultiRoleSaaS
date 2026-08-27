"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  Bus,
  IndianRupee,
  Star,
  ArrowRight,
  Play,
  CheckCircle2,
  MapPin,
  Wallet,
  Trophy,
  ClipboardCheck,
  BellRing,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

/* ---------------------------------- Data ---------------------------------- */

const awards = [
  { title: "EdTech Awards 2025", sub: "Startup of the Year" },
  { title: "India K-12 Summit", sub: "Best School ERP Solution" },
  { title: "NASSCOM Emerge 50", sub: "Education Innovation" },
  { title: "Times Business Awards", sub: "Best Learning Platform" },
  { title: "Startup India", sub: "Top 10 EdTech Platforms" },
  { title: "Digital India Awards", sub: "Excellence in e-Education" },
];

const stats = [
  {
    icon: GraduationCap,
    value: "50K+",
    label: "learners",
    desc: "Students use OmniStud daily for classes, resources and seamless campus life.",
  },
  {
    icon: BookOpen,
    value: "500+",
    label: "institutions",
    desc: "Schools, coaching centres and tutors run their operations on OmniStud.",
  },
  {
    icon: MapPin,
    value: "120+",
    label: "cities",
    desc: "From metros to tier-3 towns, OmniStud is wherever learning happens.",
  },
  {
    icon: Bus,
    value: "10K+",
    label: "trips tracked",
    desc: "Parents trust OmniStud for safe, GPS-tracked school transport every day.",
  },
];

const roleCards = [
  {
    icon: GraduationCap,
    bg: "bg-red-100",
    color: "text-[#DC2626]",
    title: "Student",
    desc: "Find tutors, access learning resources, browse marketplace, and track school transport.",
  },
  {
    icon: Users,
    bg: "bg-orange-100",
    color: "text-orange-600",
    title: "Parent",
    desc: "Monitor your child's progress, track transportation in real-time, and manage payments.",
  },
  {
    icon: BookOpen,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
    title: "Teacher / Institution",
    desc: "Manage classes, post content, view student performance, and grow your earnings.",
  },
  {
    icon: Bus,
    bg: "bg-amber-100",
    color: "text-amber-600",
    title: "Transporter",
    desc: "View routes, track student check-ins/check-outs, and manage your fleet efficiently.",
  },
];

/* --------------------------------- Page ----------------------------------- */

export default function HomePage() {
  const { user, role } = useAuth();

  const dashboardHref =
    role === "SUPER_ADMIN"
      ? "/admin/dashboard"
      : role === "SERVICE_PROVIDER"
      ? "/provider/dashboard"
      : role === "STUDENT"
      ? "/student/dashboard"
      : role === "PARENT"
      ? "/parent/dashboard"
      : "/";

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-slate-900">
      {/* ============================ Navbar + Hero ============================ */}
      <header className="relative overflow-hidden bg-[#0b1e3a]">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#DC2626]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 -right-32 h-[520px] w-[520px] rounded-full bg-[#f59e0b]/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#10b981]/10 blur-3xl" />

        {/* Navbar */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffc529]">
              <GraduationCap className="h-5 w-5 text-[#0b1e3a]" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">
              Omni<span className="text-[#ffc529]">Stud</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#ecosystem" className="transition-colors hover:text-white">Ecosystem</a>
            <a href="#showcase" className="transition-colors hover:text-white">Showcase</a>
            <a href="#roles" className="transition-colors hover:text-white">Roles</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={dashboardHref}
                className="rounded-full bg-[#ffc529] px-5 py-2 text-sm font-semibold text-[#0b1e3a] transition-colors hover:bg-[#ffd34d]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/25 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-full bg-[#ffc529] px-5 py-2 text-sm font-semibold text-[#0b1e3a] transition-colors hover:bg-[#ffd34d] sm:block"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-2 lg:pb-32 lg:pt-16">
          {/* Left: copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-[#ffd34d]">
              <Sparkles className="h-4 w-4" />
              Bridging the Education Ecosystem
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              One platform for your entire{" "}
              <span className="text-[#ffc529]">education ecosystem</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              OmniStud connects students, parents, teachers and transporters in one
              seamless experience — discover tutors, track transport, buy books and
              manage payments, all in one place.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {user ? (
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ffc529] px-8 py-4 text-base font-semibold text-[#0b1e3a] shadow-lg shadow-[#ffc529]/20 transition-all hover:-translate-y-0.5 hover:bg-[#ffd34d]"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-[#ffc529] px-8 py-4 text-base font-semibold text-[#0b1e3a] shadow-lg shadow-[#ffc529]/20 transition-all hover:-translate-y-0.5 hover:bg-[#ffd34d]"
                  >
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
            <Link
              href="/dashboard/guest"
              className="mt-5 inline-flex items-center text-sm font-medium text-slate-400 transition-colors hover:text-[#ffc529]"
            >
              Explore as Guest <ArrowRight className="ml-1 h-4 w-4" />
            </Link>

            {/* Mini trust row */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure payments
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-[#ffc529]" /> 4.8 rated by institutions
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Free to explore
              </span>
            </div>
          </div>

          {/* Right: collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex h-44 flex-col justify-between rounded-3xl bg-gradient-to-br from-[#DC2626] to-[#6a76ff] p-5 sm:h-52">
                <GraduationCap className="h-9 w-9 text-white/90" />
                <div>
                  <p className="text-2xl font-bold text-white">50K+</p>
                  <p className="text-sm text-white/70">Active learners</p>
                </div>
              </div>
              <div className="mt-8 flex h-44 flex-col justify-between rounded-3xl bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] p-5 sm:h-52">
                <Bus className="h-9 w-9 text-[#0b1e3a]/80" />
                <div>
                  <p className="text-2xl font-bold text-[#0b1e3a]">Live GPS</p>
                  <p className="text-sm text-[#0b1e3a]/70">Transport tracking</p>
                </div>
              </div>
              <div className="flex h-44 flex-col justify-between rounded-3xl bg-gradient-to-br from-[#10b981] to-[#34d399] p-5 sm:h-52">
                <Wallet className="h-9 w-9 text-white/90" />
                <div>
                  <p className="text-2xl font-bold text-white">₹2Cr+</p>
                  <p className="text-sm text-white/70">Fees processed</p>
                </div>
              </div>
              <div className="mt-8 flex h-44 flex-col justify-between rounded-3xl bg-gradient-to-br from-[#f43f5e] to-[#fb7185] p-5 sm:h-52">
                <BookOpen className="h-9 w-9 text-white/90" />
                <div>
                  <p className="text-2xl font-bold text-white">500+</p>
                  <p className="text-sm text-white/70">Institutions onboard</p>
                </div>
              </div>
            </div>

            {/* Floating notification chips */}
            <div className="absolute -left-4 top-1/2 hidden -translate-y-1/2 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-black/20 md:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Attendance marked</p>
                <p className="text-xs text-slate-500">Class 8-A · 32 present</p>
              </div>
            </div>
            <div className="absolute -right-3 top-6 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-black/20 md:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <MapPin className="h-5 w-5 text-[#DC2626]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Bus #12 arriving</p>
                <p className="text-xs text-slate-500">2 min away · Gate 2</p>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/3 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-black/20 md:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                <IndianRupee className="h-5 w-5 text-amber-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Fee received</p>
                <p className="text-xs text-slate-500">₹12,500 · Term 2</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================== Recognition strip ========================== */}
      <section className="border-b border-slate-200/60 bg-[#f4f4f2] py-14">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Recognised &amp; awarded
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {awards.map((award) => (
              <div
                key={award.title}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/60 bg-white px-3 py-5 text-center opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              >
                <Trophy className="h-6 w-6 text-slate-700" />
                <p className="text-xs font-bold text-slate-800">{award.title}</p>
                <p className="text-[11px] leading-4 text-slate-500">{award.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================== Ecosystem section ========================== */}
      <section id="ecosystem" className="bg-[#f4f4f2] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg font-semibold text-slate-400">The OmniStud app</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our education ecosystem
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              We&apos;re the platform that pulls every moving part of your institution
              into one place
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {/* Card 1: Academic Insights */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-[#e8ecff] to-amber-100 p-8 sm:p-12">
              <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Academic Insights</p>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-medium text-[#DC2626]">
                    This week
                  </span>
                </div>
                <div className="mb-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-50 py-3">
                    <p className="text-lg font-bold text-rose-500">13</p>
                    <p className="text-[11px] text-slate-500">Notices</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-3">
                    <p className="text-lg font-bold text-[#DC2626]">140</p>
                    <p className="text-[11px] text-slate-500">Students</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-3">
                    <p className="text-lg font-bold text-amber-500">12</p>
                    <p className="text-[11px] text-slate-500">Classes</p>
                  </div>
                </div>
                {/* Mini bar chart */}
                <div className="flex h-28 items-end justify-between gap-2 border-b border-slate-100 pb-1">
                  {[40, 65, 50, 85, 60, 95, 72].map((h, i) => (
                    <div key={i} className="flex w-full flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-md ${i === 5 ? "bg-[#DC2626]" : "bg-[#DC2626]/25"}`}
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-slate-400">
                        {["M", "T", "W", "T", "F", "S", "S"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="mt-8 text-xl font-bold text-slate-900">
                Insights that keep everyone in the loop
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Attendance, performance and fee analytics — visualised for teachers,
                parents and admins in real time.
              </p>
            </div>

            {/* Card 2: Everything in one tab */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 p-8 sm:p-12">
              <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Everything in one tab</p>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600">
                    All roles
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Wallet, label: "Fees", bg: "bg-emerald-100", color: "text-emerald-600" },
                    { icon: CalendarDays, label: "Timetable", bg: "bg-red-100", color: "text-[#DC2626]" },
                    { icon: ClipboardCheck, label: "Attendance", bg: "bg-amber-100", color: "text-amber-600" },
                    { icon: Bus, label: "Transport", bg: "bg-orange-100", color: "text-orange-600" },
                    { icon: BookOpen, label: "Marketplace", bg: "bg-rose-100", color: "text-rose-600" },
                    { icon: MessageSquare, label: "Messages", bg: "bg-violet-100", color: "text-violet-600" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 py-4"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${item.bg}`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="mt-8 text-xl font-bold text-slate-900">
                Every role, one seamless dashboard
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Fees, timetable, transport, marketplace and messaging — tailored views
                for students, parents, teachers and transporters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ Showcase panel ============================ */}
      <section id="showcase" className="bg-[#f4f4f2] pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1e3a] via-[#12294d] to-[#0b1e3a] px-6 py-24 sm:py-32">
            <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#DC2626]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#f59e0b]/15 blur-3xl" />

            {/* Play button */}
            <div className="relative z-10 flex justify-center">
              <button
                type="button"
                aria-label="Watch OmniStud in action"
                className="group flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl shadow-black/40 transition-transform hover:scale-105"
              >
                <Play className="h-10 w-10 translate-x-0.5 fill-slate-900 text-slate-900 transition-colors group-hover:fill-[#DC2626] group-hover:text-[#DC2626]" />
              </button>
            </div>
            <p className="relative z-10 mt-6 text-center text-sm font-medium text-slate-300">
              Watch OmniStud in action · 2 min
            </p>

            {/* Floating notification cards */}
            <div className="absolute left-6 top-10 hidden w-64 rounded-2xl bg-white/95 p-4 shadow-xl lg:block">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-[#DC2626]" />
                <p className="text-xs font-semibold text-slate-900">New assignment posted</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Mathematics · Due Friday</p>
            </div>
            <div className="absolute right-6 top-16 hidden w-64 rounded-2xl bg-white/95 p-4 shadow-xl lg:block">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-slate-900">Fee payment confirmed</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">₹2,590.50 · Receipt #1042</p>
            </div>
            <div className="absolute bottom-12 left-14 hidden w-64 rounded-2xl bg-white/95 p-4 shadow-xl lg:block">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-semibold text-slate-900">Transport update</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Route 4 · Pickup at 7:42 AM</p>
            </div>
            <div className="absolute bottom-14 right-14 hidden w-64 rounded-2xl bg-white/95 p-4 shadow-xl lg:block">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-slate-900">Leave approved</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Aarav S. · 18–19 Aug</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== Stats cards ============================= */}
      <section className="bg-[#f4f4f2] pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl bg-white p-7 shadow-sm transition-shadow hover:shadow-lg"
              >
                <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#ffc529]">
                  <stat.icon className="h-6 w-6 text-[#0b1e3a]" />
                </span>
                <p className="text-4xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                  <span className="block text-2xl">{stat.label}</span>
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== Roles section ============================ */}
      <section id="roles" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-base font-semibold text-[#DC2626]">Tailored for you</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Roles designed to meet your specific needs
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {roleCards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center transition-shadow hover:shadow-lg"
              >
                <div className={`mb-4 rounded-full p-4 ${card.bg} ${card.color}`}>
                  <card.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================ CTA band ============================== */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#DC2626] to-[#5a63e8] px-8 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#ffc529]/20 blur-2xl" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your institution?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base leading-7 text-red-100">
              Join hundreds of institutions already running their entire education
              ecosystem on OmniStud.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#ffc529] px-8 py-4 text-base font-semibold text-[#0b1e3a] transition-all hover:-translate-y-0.5 hover:bg-[#ffd34d]"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/guest"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Explore as Guest
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================== Footer + demo info ========================= */}
      <footer className="bg-slate-900 py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-emerald-400">Demo Payment Enabled</span>
          </div>
          <p className="text-sm leading-7 text-slate-300">
            Use demo accounts to explore all roles. Email:{" "}
            <span className="font-medium text-white">student@omnistud.com</span>,{" "}
            <span className="font-medium text-white">parent@omnistud.com</span>,{" "}
            <span className="font-medium text-white">teacher@omnistud.com</span>,{" "}
            <span className="font-medium text-white">transporter@omnistud.com</span>, or{" "}
            <span className="font-medium text-white">admin@omnistud.com</span> — Password
            for all: <span className="font-medium text-white">demo123</span>
          </p>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffc529]">
                <GraduationCap className="h-4 w-4 text-[#0b1e3a]" />
              </span>
              <span className="text-sm font-bold text-white">
                Omni<span className="text-[#ffc529]">Stud</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} OmniStud. Bridging the education ecosystem.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
