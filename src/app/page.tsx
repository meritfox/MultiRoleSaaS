"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { GraduationCap, Users, BookOpen, Bus, IndianRupee, Shield, Star, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      if (role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "SERVICE_PROVIDER") {
        router.push("/provider/dashboard");
      } else if (role === "STUDENT") {
        router.push("/student/dashboard");
      } else if (role === "PARENT") {
        router.push("/parent/dashboard");
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3b4cca] border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3b4cca] border-t-transparent mb-4"></div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.displayName}!</h1>
        <p className="mt-2 text-slate-600">Redirecting you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b4cca]/5 via-transparent to-[#f59e0b]/5"></div>
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pb-24 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-[#3b4cca] shadow-sm border border-[#3b4cca]/10">
              <Star className="mr-2 h-4 w-4 text-[#f59e0b]" />
              Bridging the Education Ecosystem
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Welcome to{" "}
              <span className="text-[#3b4cca]">OmniStud</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Connecting Students, Parents, Teachers, and Transporters in one seamless education ecosystem. 
              Discover tutors, track transport, buy books, and manage payments — all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Button asChild size="lg" className="px-8">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/guest" className="text-sm text-slate-500 hover:text-[#3b4cca] inline-flex items-center">
                Explore as Guest <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features / Roles */}
      <div className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-[#3b4cca]">Tailored for you</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Roles designed to meet your specific needs
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-4">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="mb-4 rounded-full bg-blue-100 p-4 text-[#3b4cca]">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <dt className="text-lg font-semibold text-slate-900">Student</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  Find tutors, access learning resources, browse marketplace, and track school transport.
                </dd>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="mb-4 rounded-full bg-orange-100 p-4 text-orange-600">
                  <Users className="h-7 w-7" />
                </div>
                <dt className="text-lg font-semibold text-slate-900">Parent</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  Monitor your child's progress, track transportation in real-time, and manage payments.
                </dd>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="mb-4 rounded-full bg-emerald-100 p-4 text-emerald-600">
                  <BookOpen className="h-7 w-7" />
                </div>
                <dt className="text-lg font-semibold text-slate-900">Teacher / Institution</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  Manage classes, post content, view student performance, and grow your earnings.
                </dd>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="mb-4 rounded-full bg-amber-100 p-4 text-amber-600">
                  <Bus className="h-7 w-7" />
                </div>
                <dt className="text-lg font-semibold text-slate-900">Transporter</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  View routes, track student check-ins/check-outs, and manage your fleet efficiently.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Demo credentials hint */}
      <div className="bg-slate-900 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Demo Payment Enabled</span>
          </div>
          <p className="text-slate-300 text-sm">
            Use demo accounts to explore all roles. Email: <span className="text-white font-medium">student@omnistud.com</span>,{" "}
            <span className="text-white font-medium">parent@omnistud.com</span>,{" "}
            <span className="text-white font-medium">teacher@omnistud.com</span>,{" "}
            <span className="text-white font-medium">transporter@omnistud.com</span>, or{" "}
            <span className="text-white font-medium">admin@omnistud.com</span> — Password for all: <span className="text-white font-medium">demo123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
