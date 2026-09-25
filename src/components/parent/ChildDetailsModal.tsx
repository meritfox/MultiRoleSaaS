"use client";

import React from "react";
import Link from "next/link";
import { StudentProfile, Service } from "@/types";
import { Button } from "@/components/ui/Button";
import { X, GraduationCap, Bus, MapPin, Sparkles } from "lucide-react";

interface ChildDetailsModalProps {
  child: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  services?: Service[];
}

export function ChildDetailsModal({ child, isOpen, onClose, services = [] }: ChildDetailsModalProps) {
  if (!isOpen || !child) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] text-white flex items-center justify-center font-bold text-xl shadow-soft">
              {child.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{child.displayName}</h3>
              <p className="text-xs text-slate-500">
                {child.grade || "Class 6"} · {child.school || "DAV Public School"}
              </p>
              {child.studentIdCode && (
                <span className="inline-block mt-0.5 text-xs font-mono text-[#DC2626] font-semibold">
                  Student ID: {child.studentIdCode}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Board</span>
              <span className="font-semibold text-slate-800">{child.board || "CBSE"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
              <span className="font-semibold text-slate-800">{child.gender || "Not specified"}</span>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bus className="h-4 w-4 text-amber-600" />
                School Transportation
              </h4>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active Route
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-700">
              <p><span className="font-medium text-slate-900">Assigned Bus:</span> Route R-12 (SafeRide Transit)</p>
              <p><span className="font-medium text-slate-900">Morning Pickup:</span> 07:20 AM · Bistupur Market Point</p>
              <p><span className="font-medium text-slate-900">Afternoon Drop:</span> 01:50 PM · Bistupur Market Point</p>
              <p><span className="font-medium text-slate-900">Driver Contact:</span> Rajesh Kumar (+91 98765 12345)</p>
            </div>
            <div className="mt-3">
              <Button asChild size="sm" className="w-full text-xs">
                <Link href="/parent/dashboard/live-map">
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Open Live GPS Bus Tracking
                </Link>
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-[#DC2626]" />
              Learning & Enrolled Services ({services.length})
            </h4>
            {services.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-4 text-center text-xs text-slate-500">
                No extra tutoring booked for {child.displayName} yet.
                <div className="mt-2">
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link href="/parent/dashboard/services">
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-[#DC2626]" /> Find Tutors & Services
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => (
                  <div key={svc.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{svc.name}</p>
                      <p className="text-slate-500">{svc.providerType}</p>
                    </div>
                    <span className="font-bold text-slate-900">₹{svc.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>

            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Class</span>
              <span className="font-semibold text-slate-800">{child.grade || "Class 6"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span>
              <span className="font-semibold text-slate-800">{child.age ? `${child.age} yrs` : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

