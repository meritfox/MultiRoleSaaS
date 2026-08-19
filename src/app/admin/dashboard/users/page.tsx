"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Plus,
  Wallet,
  UserX,
  UserCheck,
  Trash2,
  RefreshCw,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { getAllUsers, toggleUserBlock, deleteUserAccount } from "@/lib/services/users";
import { getAllEscrowTransactions } from "@/lib/services/payments";
import { UserProfile, EscrowTransaction } from "@/types";
import {
  cn,
  formatINR,
  formatRole,
  formatShortDate,
  roleBadgeVariant,
} from "@/lib/utils";

const ADMIN_ROLE = "SUPER_ADMIN";
const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "STUDENT", label: "Student" },
  { value: "PARENT", label: "Parent" },
  { value: "TEACHER", label: "Teacher" },
  { value: "TRANSPORTER", label: "Transporter" },
  { value: "SERVICE_PROVIDER", label: "Service Provider" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Status: All" },
  { value: "ACTIVE", label: "Status: Active" },
  { value: "SUSPENDED", label: "Status: Suspended" },
  { value: "PENDING", label: "Status: Pending" },
];

const SORT_OPTIONS = [
  { value: "NEWEST", label: "Sort: Newest" },
  { value: "OLDEST", label: "Sort: Oldest" },
  { value: "NAME", label: "Sort: Name A-Z" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [escrow, setEscrow] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, escrowData] = await Promise.all([
        getAllUsers(),
        getAllEscrowTransactions(),
      ]);
      setUsers(usersData);
      setEscrow(escrowData);
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer so the synchronous setLoading inside loadData runs after the effect body.
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  /** Held escrow attributable to a user, either as payer or as payee. */
  const escrowBalanceOf = useMemo(() => {
    const map = new Map<string, number>();
    escrow
      .filter((t) => t.status === "HELD")
      .forEach((t) => {
        map.set(t.payerId, (map.get(t.payerId) ?? 0) + t.amount);
        map.set(t.providerId, (map.get(t.providerId) ?? 0) + t.amount);
      });
    return map;
  }, [escrow]);

  const handleBlock = async (uid: string, blocked?: boolean) => {
    try {
      await toggleUserBlock(uid, !blocked);
      setUsers(users.map((u) => (u.uid === uid ? { ...u, blocked: !blocked } : u)));
    } catch (err) {
      console.error(err);
      setError("Failed to update user.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUserAccount(deleteTarget.uid);
      setUsers(users.filter((u) => u.uid !== deleteTarget.uid));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.uid);
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      const matchesSearch =
        !q ||
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !u.blocked) ||
        (statusFilter === "SUSPENDED" && !!u.blocked) ||
        (statusFilter === "PENDING" && !u.blocked && u.paymentStatus !== "COMPLETED");
      return matchesSearch && matchesRole && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sort === "NAME") return (a.displayName || "").localeCompare(b.displayName || "");
      if (sort === "OLDEST") return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });

    return list;
  }, [users, search, roleFilter, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allPageSelected = pageRows.length > 0 && pageRows.every((u) => selected.has(u.uid));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageRows.forEach((u) => next.delete(u.uid));
      else pageRows.forEach((u) => next.add(u.uid));
      return next;
    });
  };

  const toggleSelect = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const exportCsv = () => {
    const rows: string[][] = [
      ["Name", "Email", "Phone", "Role", "Status", "Escrow Balance (INR)", "Joined"],
      ...filtered.map((u) => [
        u.displayName || "",
        u.email || "",
        u.phoneNumber || "",
        formatRole(u.role),
        u.blocked ? "Suspended" : "Active",
        String(escrowBalanceOf.get(u.uid) ?? 0),
        new Date(u.createdAt).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnistud-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="User Management">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">User Management</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Manage learners, parents, drivers, and platform operators.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button asChild>
                <Link href="/register">
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Link>
              </Button>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Card noPadding>
            {/* Filter bar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, email, phone..."
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center">
                <Select
                  options={ROLE_OPTIONS}
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="lg:w-44"
                  aria-label="Filter by role"
                />
                <Select
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="lg:w-44"
                  aria-label="Filter by status"
                />
                <Select
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="lg:w-40"
                  aria-label="Sort users"
                />
                <Button variant="ghost" onClick={loadData} aria-label="Refresh users">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Users table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all users on this page"
                        className="h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                      />
                    </th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Escrow Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((u) => {
                    const balance = escrowBalanceOf.get(u.uid) ?? 0;
                    return (
                      <tr
                        key={u.uid}
                        className={cn(
                          "transition-colors hover:bg-slate-50/60",
                          selected.has(u.uid) && "bg-[#EEF2FF]/40"
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(u.uid)}
                            onChange={() => toggleSelect(u.uid)}
                            aria-label={`Select ${u.displayName}`}
                            className="h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.displayName} src={u.photoURL} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{u.displayName}</p>
                              <p className="truncate text-xs text-slate-500">
                                {u.email}{u.phoneNumber ? ` · ${u.phoneNumber}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={roleBadgeVariant(u.role)}>{formatRole(u.role)}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {balance > 0 ? formatINR(balance) : <span className="text-slate-400">--</span>}
                        </td>
                        <td className="px-4 py-3">
                          {u.blocked ? (
                            <Badge variant="danger" dot>Suspended</Badge>
                          ) : u.paymentStatus === "COMPLETED" ? (
                            <Badge variant="success" dot>Active</Badge>
                          ) : (
                            <Badge variant="warning" dot>Pending</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatShortDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu
                            label={`Actions for ${u.displayName}`}
                            items={[
                              {
                                label: "View Ledger",
                                icon: <Wallet className="h-4 w-4" />,
                                onClick: () => window.location.assign("/admin/dashboard/escrow"),
                              },
                              u.blocked
                                ? {
                                    label: "Reactivate User",
                                    icon: <UserCheck className="h-4 w-4" />,
                                    onClick: () => handleBlock(u.uid, u.blocked),
                                  }
                                : {
                                    label: "Suspend User",
                                    icon: <UserX className="h-4 w-4" />,
                                    onClick: () => handleBlock(u.uid, u.blocked),
                                  },
                              {
                                label: "Delete User",
                                icon: <Trash2 className="h-4 w-4" />,
                                destructive: true,
                                onClick: () => setDeleteTarget(u),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pageRows.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  No users match the current filters.
                </p>
              )}
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
              <div className="text-sm text-slate-500">
                {selected.size > 0 && (
                  <span className="font-medium text-[#DC2626]">{selected.size} selected · </span>
                )}
              </div>
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </div>
          </Card>
        </div>

        <ConfirmModal
          open={!!deleteTarget}
          title="Delete user account?"
          description={`This will permanently remove ${deleteTarget?.displayName ?? "this user"} (${deleteTarget?.email ?? ""}) and all associated profile data. This action cannot be undone.`}
          confirmLabel="Delete User"
          destructive
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
