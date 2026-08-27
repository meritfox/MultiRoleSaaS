"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Service, ServiceRequest, StudentProfile } from "@/types";
import {
  createServiceRequest,
  getRequestsByProvider,
  getServicesByProvider,
  updateServiceRequestStatus,
} from "@/lib/services/services";
import { cn, formatINR, formatDate, formatShortDate, type BadgeVariant } from "@/lib/utils";
import {
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  Plus,
  RefreshCw,
  Search,
  UserX,
  X,
} from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";
const PAGE_SIZE = 8;

interface RequestRow extends ServiceRequest {
  service?: Service;
  student?: StudentProfile;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Filter by Status: All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const DATE_OPTIONS = [
  { value: "ALL", label: "Date Range: All Time" },
  { value: "TODAY", label: "Today" },
  { value: "WEEK", label: "Last 7 Days" },
  { value: "MONTH", label: "This Month" },
];

type SortKey = "createdAt" | "id" | "status";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "danger";
    case "COMPLETED":
      return "indigo";
    default:
      return "slate";
  }
}

/** Human label for a raw status enum. */
function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/** Stable short request code like "OS-9F2A". */
function requestCode(id: string): string {
  return `OS-${id.slice(0, 4).toUpperCase()}`;
}

/** Primary row action label per status, mirroring the reference UI. */
function actionLabel(status: string): string {
  if (status === "PENDING") return "Review";
  if (status === "COMPLETED") return "Invoice";
  return "View";
}

export default function ProviderRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  /** Cutoff timestamp captured when the date filter changes; 0 = no cutoff. */
  const [dateCutoff, setDateCutoff] = useState(0);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<RequestRow | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newBusy, setNewBusy] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [rows, svcList] = await Promise.all([
        getRequestsByProvider(user.uid),
        getServicesByProvider(user.uid),
      ]);
      setRequests(rows as RequestRow[]);
      setServices(svcList);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Defer so the synchronous setState inside loadData runs after the effect body.
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const flashSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    setBusy(true);
    try {
      const request = requests.find((r) => r.id === requestId);
      await updateServiceRequestStatus(requestId, newStatus, request?.service?.name);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      setViewing(null);
      flashSuccess(`Request ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      console.error("Failed to update request:", err);
      setError("Failed to update request status.");
    } finally {
      setBusy(false);
    }
  };

  const bulkSet = async (status: "APPROVED" | "REJECTED") => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          updateServiceRequestStatus(
            id,
            status,
            requests.find((r) => r.id === id)?.service?.name
          )
        )
      );
      setRequests((prev) =>
        prev.map((r) => (selected.has(r.id) ? { ...r, status } : r))
      );
      const count = selected.size;
      setSelected(new Set());
      flashSuccess(
        `${count} request${count > 1 ? "s" : ""} ${status.toLowerCase()}.`
      );
    } catch (err) {
      console.error("Bulk update failed:", err);
      setError("Failed to update selected requests.");
    } finally {
      setBusy(false);
    }
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(requestCode(id));
      flashSuccess("Request ID copied to clipboard.");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const openNew = () => {
    setNewError(null);
    setNewEmail("");
    setNewServiceId(services[0]?.id ?? "");
    setNewOpen(true);
  };

  const createNew = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !newServiceId) {
      setNewError("Enter a student email and choose a service.");
      return;
    }
    setNewBusy(true);
    setNewError(null);
    try {
      const snap = await getDocs(
        query(
          collection(db, "users"),
          where("email", "==", email),
          where("role", "==", "STUDENT")
        )
      );
      if (snap.empty) {
        setNewError("No student found with that email.");
        return;
      }
      const service = services.find((s) => s.id === newServiceId);
      if (!service) {
        setNewError("Choose a service.");
        return;
      }
      await createServiceRequest(snap.docs[0].id, service);
      setNewOpen(false);
      flashSuccess("Request created for the student.");
      await loadData();
    } catch (err) {
      setNewError(err instanceof Error ? err.message : "Failed to create request.");
    } finally {
      setNewBusy(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const subjectOptions = useMemo(() => {
    const subjects = Array.from(
      new Set(
        services
          .map((s) => s.subject)
          .filter((v): v is string => Boolean(v))
      )
    ).sort();
    return [
      { value: "ALL", label: "Filter by Subject: All" },
      ...subjects.map((s) => ({ value: s, label: s })),
    ];
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const DAY = 86400000;
    const cutoffDate = new Date(dateCutoff);
    const list = requests.filter((r) => {
      const student = r.student;
      const service = r.service;
      const matchesSearch =
        !q ||
        student?.displayName?.toLowerCase().includes(q) ||
        student?.email?.toLowerCase().includes(q) ||
        service?.name?.toLowerCase().includes(q) ||
        service?.subject?.toLowerCase().includes(q) ||
        requestCode(r.id).toLowerCase().includes(q);
      const matchesSubject =
        subjectFilter === "ALL" || service?.subject === subjectFilter;
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const created = new Date(r.createdAt);
      const matchesDate =
        dateFilter === "ALL" ||
        (dateFilter === "TODAY" && dateCutoff - r.createdAt < DAY) ||
        (dateFilter === "WEEK" && dateCutoff - r.createdAt < 7 * DAY) ||
        (dateFilter === "MONTH" &&
          dateCutoff > 0 &&
          created.getMonth() === cutoffDate.getMonth() &&
          created.getFullYear() === cutoffDate.getFullYear());
      return matchesSearch && matchesSubject && matchesStatus && matchesDate;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = a.createdAt - b.createdAt;
      else if (sortKey === "id") cmp = a.id.localeCompare(b.id);
      else cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [requests, search, subjectFilter, statusFilter, dateFilter, dateCutoff, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    subjectFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    dateFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("ALL");
    setStatusFilter("ALL");
    setDateFilter("ALL");
    setDateCutoff(0);
    setPage(1);
  };

  const rowActions = (r: RequestRow): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [
      {
        label: "View details",
        icon: <Eye className="h-4 w-4" />,
        onClick: () => setViewing(r),
      },
      {
        label: "Copy request ID",
        icon: <Copy className="h-4 w-4" />,
        onClick: () => void copyId(r.id),
      },
    ];
    if (r.status === "PENDING") {
      items.push(
        {
          label: "Approve",
          icon: <Check className="h-4 w-4" />,
          onClick: () => void handleUpdateStatus(r.id, "APPROVED"),
        },
        {
          label: "Reject",
          icon: <X className="h-4 w-4" />,
          onClick: () => void handleUpdateStatus(r.id, "REJECTED"),
          destructive: true,
        }
      );
    }
    return items;
  };

  const summary = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let completed = 0;
    let value = 0;
    for (const r of requests) {
      // Compare as a plain string so future statuses (e.g. COMPLETED) type-check.
      const status = r.status as string;
      if (status === "APPROVED") {
        approved += 1;
        value += r.service?.price ?? 0;
      } else if (status === "PENDING") {
        pending += 1;
      } else if (status === "COMPLETED") {
        completed += 1;
      }
    }
    return { approved, pending, completed, value };
  }, [requests]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title="Service Requests">
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Service Requests</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Manage requests from students.
            </p>
          </div>

          {/* Flash messages */}
          {error && (
            <Alert variant="error" className="flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="ml-4 text-current opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{success}</span>
            </Alert>
          )}

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-2.5 text-sm shadow-sm">
              <span className="font-medium text-slate-900">
                {selected.size} selected
              </span>
              <Button
                size="sm"
                variant="success"
                disabled={busy}
                onClick={() => void bulkSet("APPROVED")}
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() => void bulkSet("REJECTED")}
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Filters + table card */}
          <Card noPadding className="overflow-hidden">
            {/* Filter row */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <Input
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Search Students or Subjects..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Search requests"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center">
                <Select
                  options={subjectOptions}
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value);
                    setPage(1);
                  }}
                  className="lg:w-48"
                  aria-label="Filter by subject"
                />
                <Select
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="lg:w-48"
                  aria-label="Filter by status"
                />
                <Select
                  options={DATE_OPTIONS}
                  value={dateFilter}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDateFilter(v);
                    // Capture the cutoff here (event handler) so memoized
                    // filtering stays pure.
                    setDateCutoff(v === "ALL" ? 0 : Date.now());
                    setPage(1);
                  }}
                  className="lg:w-48"
                  aria-label="Filter by date range"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setLoading(true);
                      void loadData();
                    }}
                    aria-label="Refresh requests"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={openNew} className="h-10 px-4">
                    <Plus className="mr-1.5 h-4 w-4" /> New Request
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all requests on this page"
                        className="h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                      />
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("createdAt")}
                        className="inline-flex items-center gap-1 uppercase tracking-wide"
                      >
                        Date Received
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("id")}
                        className="inline-flex items-center gap-1 uppercase tracking-wide"
                      >
                        Request ID
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Student &amp; Grade</th>
                    <th className="px-4 py-3">Subject &amp; Service</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 uppercase tracking-wide"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <UserX className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-700">
                          No requests found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {hasActiveFilters
                            ? "No requests match your current filters."
                            : "Student requests will appear here once they arrive."}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-4"
                            onClick={resetFilters}
                          >
                            Reset filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (

                    pageRows.map((r) => (
                      <tr
                        key={r.id}
                        className={cn(
                          "transition-colors hover:bg-slate-50/60",
                          selected.has(r.id) && "bg-[#EEF2FF]/40"
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            aria-label={`Select request ${requestCode(r.id)}`}
                            className="h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatShortDate(r.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                          {requestCode(r.id)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {r.student?.displayName ?? "Unknown student"}
                            {r.student?.grade ? ` (Grade ${r.student.grade})` : ""}
                          </p>
                          <p className="text-xs text-slate-500">
                            ({r.student?.email ?? "no email"})
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {r.service?.name ?? "Deleted service"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {r.service?.subject ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-900">
                          {formatINR(r.service?.price ?? 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={statusVariant(r.status)}>
                            {r.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewing(r)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-soft transition-all hover:bg-slate-50 hover:border-slate-300"
                            >
                              {actionLabel(r.status)}
                            </button>
                            <DropdownMenu items={rowActions(r)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="border-t border-slate-100 p-4">
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
                itemLabel="Requests"
              />
            </div>
          </Card>

          {/* Request summary footer */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200/60 bg-white px-5 py-4 text-sm shadow-sm">
            <span className="font-semibold text-slate-900">Request Summary</span>
            <span className="text-slate-500">
              Total Approved:{" "}
              <span className="font-medium text-slate-900">{summary.approved}</span>
            </span>
            <span className="text-slate-500">
              Total Pending:{" "}
              <span className="font-medium text-slate-900">{summary.pending}</span>
            </span>
            <span className="text-slate-500">
              Total Completed:{" "}
              <span className="font-medium text-slate-900">{summary.completed}</span>
            </span>
            <span className="text-slate-500">
              Total Value:{" "}
              <span className="font-medium text-slate-900">
                {formatINR(summary.value)}
              </span>
            </span>
          </div>
        </div>

        {/* Request detail modal */}
        {viewing && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setViewing(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Request ${requestCode(viewing.id)}`}
              className="w-full max-w-lg rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Request {requestCode(viewing.id)}
                  </h3>
                  <Badge variant={statusVariant(viewing.status)}>
                    {viewing.status.toUpperCase()}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  aria-label="Close details"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4 text-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Student
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {viewing.student?.displayName ?? "Unknown student"}
                      {viewing.student?.grade ? ` (Grade ${viewing.student.grade})` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {viewing.student?.email ?? ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Service
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {viewing.service?.name ?? "Deleted service"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {viewing.service?.subject ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Price
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatINR(viewing.service?.price ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Received
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDate(viewing.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </p>
                    <p className="mt-1">
                      <Badge variant={statusVariant(viewing.status)}>
                        {statusLabel(viewing.status)}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Last Updated
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDate(viewing.updatedAt)}
                    </p>
                  </div>
                </div>

                {viewing.status === "PENDING" ? (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleUpdateStatus(viewing.id, "REJECTED")}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleUpdateStatus(viewing.id, "APPROVED")}
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                    <Button variant="outline" size="sm" onClick={() => void copyId(viewing.id)}>
                      <Copy className="mr-1 h-4 w-4" /> Copy ID
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setViewing(null)}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New request modal */}
        {newOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => !newBusy && setNewOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="New service request"
              className="w-full max-w-md rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  New Service Request
                </h3>
                <button
                  type="button"
                  onClick={() => !newBusy && setNewOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 px-5 py-4">
                {newError && <Alert variant="error">{newError}</Alert>}
                <Input
                  label="Student Email"
                  type="email"
                  placeholder="student@omnistud.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Service
                  </label>
                  <Select
                    options={services.map((s) => ({
                      value: s.id,
                      label: `${s.name} — ${formatINR(s.price)}`,
                    }))}
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    disabled={services.length === 0}
                    aria-label="Choose a service"
                  />
                  {services.length === 0 && (
                    <p className="text-xs text-slate-500">
                      You have no services yet. Create one from My Services first.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewOpen(false)}
                    disabled={newBusy}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void createNew()}
                    isLoading={newBusy}
                    disabled={services.length === 0 || newBusy}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Create Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

