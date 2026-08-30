"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills, FilterPillOption } from "@/components/ui/FilterPills";
import { ServiceCard } from "@/components/student/ServiceCard";
import { ActivitySummary } from "@/components/student/ActivitySummary";
import { Service, ServiceRequest, MarketplaceItem, Job, EscrowTransaction } from "@/types";
import { getAllServices, createServiceRequest, getRequestsByStudent } from "@/lib/services/services";
import { getMarketplaceItems } from "@/lib/services/marketplace";
import { getJobs } from "@/lib/services/jobs";
import { getEscrowByPayer } from "@/lib/services/payments";
import { formatShortDate, requestStatusVariant } from "@/lib/utils";
import {
  Search,
  GraduationCap,
  Bus,
  ShoppingCart,
  Briefcase,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const STUDENT_ROLE = "STUDENT" as const;

type CategoryFilter = "ALL" | "TEACHER" | "TRANSPORTER" | "INSTITUTION";

const QUICK_ACTIONS = [
  {
    title: "Find Tutors",
    description: "Teachers & institutions by subject or school",
    href: "/student/dashboard/tutors",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    title: "School Transport",
    description: "Buses & vans with live GPS tracking",
    href: "/student/dashboard/transport",
    icon: <Bus className="h-5 w-5" />,
  },
  {
    title: "Marketplace",
    description: "Buy & sell books and school items",
    href: "/student/dashboard/marketplace",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    title: "Job Board",
    description: "Local gigs & student requests",
    href: "/student/dashboard/jobs",
    icon: <Briefcase className="h-5 w-5" />,
  },
];

const REQUEST_LABELS: Record<ServiceRequest["status"], string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [myRequests, setMyRequests] = useState<(ServiceRequest & { service?: Service })[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);

        if (user) {
          const [requestsData, itemsData, jobsData, escrowData] = await Promise.all([
            getRequestsByStudent(user.uid),
            getMarketplaceItems().catch(() => [] as MarketplaceItem[]),
            getJobs().catch(() => [] as Job[]),
            getEscrowByPayer(user.uid).catch(() => [] as EscrowTransaction[]),
          ]);
          setMyRequests(requestsData);
          setMarketplaceItems(itemsData);
          setJobs(jobsData);
          setEscrowTransactions(escrowData);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load available services.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAvailService = async (service: Service) => {
    if (!user) return;
    setRequestingId(service.id);
    setError(null);
    setSuccess(null);

    try {
      const newRequest = await createServiceRequest(user.uid, service);
      setMyRequests([...myRequests, newRequest]);
      setSuccess(`Service "${service.name}" requested successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error requesting service:", err);
      setError("Failed to request service. Please try again.");
    } finally {
      setRequestingId(null);
    }
  };

  const counts = useMemo(() => {
    const base: Record<CategoryFilter, number> = {
      ALL: services.length,
      TEACHER: 0,
      TRANSPORTER: 0,
      INSTITUTION: 0,
    };
    for (const s of services) {
      const key = s.providerType as CategoryFilter;
      if (key in base) base[key] += 1;
    }
    return base;
  }, [services]);

  const filterOptions: FilterPillOption<CategoryFilter>[] = [
    { value: "ALL", label: "All", count: counts.ALL },
    { value: "TEACHER", label: "Tutors", count: counts.TEACHER, icon: <GraduationCap className="h-3.5 w-3.5" /> },
    { value: "TRANSPORTER", label: "Transport", count: counts.TRANSPORTER, icon: <Bus className="h-3.5 w-3.5" /> },
    { value: "INSTITUTION", label: "Institutions", count: counts.INSTITUTION },
  ];

  const visibleServices = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return services.filter((service) => {
      if (categoryFilter !== "ALL" && service.providerType !== categoryFilter) return false;
      if (!needle) return true;
      return (
        service.name.toLowerCase().includes(needle) ||
        service.providerType.toLowerCase().includes(needle) ||
        service.description.toLowerCase().includes(needle)
      );
    });
  }, [services, searchTerm, categoryFilter]);

  const getRequestStatus = (serviceId: string) => {
    const request = myRequests.find((r) => r.serviceId === serviceId);
    return request?.status;
  };

  const recentRequests = useMemo(
    () => [...myRequests].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3),
    [myRequests]
  );

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const isFiltered = searchTerm.trim() !== "" || categoryFilter !== "ALL";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Student Dashboard">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_330px]">
          {/* ===== Main content column ===== */}
          <div className="min-w-0 space-y-6">
          {/* Greeting */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Hi, {firstName}!
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and request services - everything starts here.
            </p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Unified search + category filters */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tutors, transport, institutions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm transition-all duration-200 focus:outline-none focus:border-[#DC2626]/40 focus:bg-white focus:shadow-glow"
              />
            </div>
            <FilterPills
              className="mt-3"
              options={filterOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>

          {/* My activity strip - only shows when the student has requests */}
          {recentRequests.length > 0 && (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">My recent requests</h3>
                <Link
                  href="/student/dashboard/requests"
                  className="text-xs font-medium text-[#DC2626] hover:text-[#B91C1C]"
                >
                  View all
                </Link>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {recentRequests.map((request) => {
                  const matched = services.find((s) => s.id === request.serviceId);
                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {matched?.name ?? "Service request"}
                        </p>
                        <p className="text-xs text-slate-500">{formatShortDate(request.createdAt)}</p>
                      </div>
                      <Badge variant={requestStatusVariant(request.status)}>
                        {REQUEST_LABELS[request.status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-lift"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100/70 text-[#DC2626]">
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{action.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#DC2626]" />
              </Link>
            ))}
          </div>

          {/* Services grid */}
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Available services</h3>
                {isFiltered && (
                  <p className="text-sm text-slate-500">
                    {visibleServices.length} {visibleServices.length === 1 ? "result" : "results"}
                  </p>
                )}
              </div>
            </div>
            {visibleServices.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No services found"
                description="Try adjusting your search or picking a different category."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleServices.map((service) => {
                  const status = getRequestStatus(service.id);
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      requestStatus={status}
                      onRequest={status ? undefined : () => handleAvailService(service)}
                      requesting={requestingId === service.id}
                    />
                  );
                })}
              </div>
            )}
          </div>
          </div>

          {/* ===== Right rail: Activity Summary ===== */}
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <ActivitySummary
              userName={user?.displayName ?? "Student"}
              requests={myRequests}
              marketplaceItems={marketplaceItems}
              jobs={jobs}
              escrowTransactions={escrowTransactions}
            />
          </aside>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
