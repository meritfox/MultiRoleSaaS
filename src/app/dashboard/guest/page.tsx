"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GraduationCap, Users, BookOpen, Bus, Search, MapPin, Star } from "lucide-react";

export default function GuestDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6]">
              <span className="text-lg font-bold text-white">O</span>
            </div>
            <span className="text-xl font-bold text-[#3b4cca]">OmniStud</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Explore OmniStud</h1>
          <p className="mt-2 text-slate-600">Preview the platform features before signing up</p>
        </div>

        <div className="relative max-w-2xl mx-auto mb-10">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tutors, schools, transport services..."
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { icon: <GraduationCap className="h-6 w-6" />, title: "Students", desc: "Find tutors and learning resources", color: "bg-blue-100 text-[#3b4cca]" },
            { icon: <Users className="h-6 w-6" />, title: "Parents", desc: "Track children and manage services", color: "bg-orange-100 text-orange-600" },
            { icon: <BookOpen className="h-6 w-6" />, title: "Teachers", desc: "Offer classes and grow earnings", color: "bg-emerald-100 text-emerald-600" },
            { icon: <Bus className="h-6 w-6" />, title: "Transporters", desc: "Manage routes and fleet", color: "bg-amber-100 text-amber-600" },
          ].map((item) => (
            <Card key={item.title} className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className={`inline-flex p-3 rounded-xl ${item.color} mb-3`}>{item.icon}</div>
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
            </Card>
          ))}
        </div>

        <Card title="Featured Services" description="Popular tutors and transport providers in Guwahati">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Math Tutoring - Grade 5", type: "Tutor", price: "₹2,500", rating: 4.8 },
              { name: "School Bus Route #15", type: "Transport", price: "₹3,500", rating: 4.6 },
              { name: "Science Class - Grade 5", type: "Tutor", price: "₹2,000", rating: 4.7 },
            ].map((service) => (
              <div key={service.name} className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-[#3b4cca]">{service.type}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <Star className="h-4 w-4 fill-current" />
                    {service.rating}
                  </div>
                </div>
                <h4 className="font-medium text-slate-900">{service.name}</h4>
                <p className="text-lg font-bold text-[#3b4cca] mt-2">{service.price}<span className="text-sm text-slate-500 font-normal">/month</span></p>
                <Button size="sm" className="w-full mt-3" asChild>
                  <Link href="/register">Sign Up to Book</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
