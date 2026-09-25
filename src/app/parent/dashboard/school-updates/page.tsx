"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { School, Calendar, Bell, Info } from "lucide-react";

const ROLE = "PARENT";

export default function SchoolUpdatesPage() {
  const announcements = [
    {
      id: "1",
      title: "Annual Sports Day Schedule",
      date: "Oct 15, 2026",
      school: "DAV Public School",
      content: "All students are requested to report in sports track suits at 7:30 AM. Parents are warmly invited.",
      type: "EVENT",
    },
    {
      id: "2",
      title: "Mid-Term Examination Datesheet Released",
      date: "Oct 02, 2026",
      school: "DAV Public School",
      content: "Examination timetable for Class 1 to 10 has been published. Please check the student portal.",
      type: "NOTICE",
    },
    {
      id: "3",
      title: "Bus Route R-12 Temporary Diversion",
      date: "Sep 28, 2026",
      school: "OmniStud Transit Alert",
      content: "Due to road resurfacing near Jubilee Park, morning pickup will be 10 minutes earlier on Friday.",
      type: "TRANSPORT",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="School Updates">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <School className="h-6 w-6 text-[#DC2626]" />
              School Updates & Notices
            </h2>
            <p className="text-sm text-slate-600">
              Stay informed with official school circulars, event schedules, and transport notices.
            </p>
          </div>

          <div className="space-y-4">
            {announcements.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    a.type === "EVENT" ? "bg-purple-100 text-purple-600" :
                    a.type === "TRANSPORT" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-[#DC2626]"
                  }`}>
                    {a.type === "EVENT" ? <Calendar className="h-5 w-5" /> :
                     a.type === "TRANSPORT" ? <Info className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">{a.title}</h4>
                      <span className="text-xs text-slate-400 font-medium">{a.date}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{a.school}</p>
                    <p className="text-sm text-slate-700 pt-1 leading-relaxed">{a.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

