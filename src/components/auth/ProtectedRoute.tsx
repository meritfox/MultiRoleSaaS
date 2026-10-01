"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const normalizeRole = (role: UserRole | null): UserRole | null => {
  if (role === "TEACHER" || role === "TRANSPORTER") return "SERVICE_PROVIDER";
  return role;
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const normalizedRole = normalizeRole(role as UserRole | null);
  const normalizedAllowedRoles = allowedRoles?.map((r) => normalizeRole(r) as UserRole);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole as UserRole)) {
        router.replace("/unauthorized");
      }
    }
  }, [user, loading, normalizedRole, normalizedAllowedRoles, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole as UserRole))) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;