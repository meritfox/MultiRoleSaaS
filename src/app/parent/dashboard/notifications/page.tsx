"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { getNotifications, markNotificationRead } from "@/lib/services/services";
import { Notification } from "@/types";
import { Bell, CheckCircle, Clock3, AlertTriangle } from "lucide-react";

const ROLE = "PARENT";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.uid)
      .then((data) => setNotifications(data))
      .finally(() => setLoading(false));
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLE]}>
      <DashboardLayout title="Notifications">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-[#DC2626]" />
              Notifications & Alerts
            </h2>
            <p className="text-sm text-slate-600">
              Live bus check-in alerts, school messages, and payment notices.
            </p>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card>
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Bell className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  No notifications yet.
                </div>
              </Card>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    n.read ? "bg-white border-slate-200/80" : "bg-red-50/50 border-red-200 shadow-sm"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === "SUCCESS" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    {n.type === "WARNING" && <Clock3 className="h-5 w-5 text-amber-500" />}
                    {n.type === "ALERT" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {n.type === "INFO" && <Bell className="h-5 w-5 text-[#DC2626]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                      <span className="text-[11px] text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-[#DC2626] shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

