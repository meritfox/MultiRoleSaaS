"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { updateUserProfile, UserProfileUpdate } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import { GraduationCap, Users, BookOpen, Bus, Check, HelpCircle } from "lucide-react";

interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const ROLES: RoleOption[] = [
  {
    id: "STUDENT",
    label: "STUDENT",
    description: "Access learning resources, connect with tutors, view assignments.",
    icon: <GraduationCap className="h-8 w-8" />,
    color: "#DC2626",
    features: ["Find tutors", "Access resources", "View assignments"],
  },
  {
    id: "PARENT",
    label: "PARENT",
    description: "Monitor child's progress, track transportation, manage payments.",
    icon: <Users className="h-8 w-8" />,
    color: "#f59e0b",
    features: ["Track children", "Live GPS view", "Manage payments"],
  },
  {
    id: "SERVICE_PROVIDER",
    label: "TEACHER / INSTITUTION",
    description: "Manage classes, post content, view student performance.",
    icon: <BookOpen className="h-8 w-8" />,
    color: "#10b981",
    features: ["Create classes", "Post content", "Track earnings"],
  },
  {
    id: "SERVICE_PROVIDER",
    label: "TRANSPORTATION PROVIDER",
    description: "View routes, track student check-ins, manage fleet.",
    icon: <Bus className="h-8 w-8" />,
    color: "#f97316",
    features: ["Manage routes", "Check-in/out", "Fleet tracking"],
  },
];

export default function RoleSelectionPage() {
  const { firebaseUser, refreshUser } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [providerType, setProviderType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    setSelectedLabel(role.label);
    if (role.label === "TEACHER / INSTITUTION") {
      setProviderType("TEACHER");
    } else if (role.label === "TRANSPORTATION PROVIDER") {
      setProviderType("TRANSPORTER");
    } else {
      setProviderType("");
    }
  };

  const handleContinue = async () => {
    if (!selectedRole || !firebaseUser) {
      setError("Please select a role to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: UserProfileUpdate = { role: selectedRole };
      if (providerType) {
        updateData.providerType = providerType;
      }
      await updateUserProfile(firebaseUser.uid, updateData);
      await refreshUser();
      router.push("/register/subscription");
    } catch (err: unknown) {
      console.error(err);
      setError((err as { message?: string })?.message || "Failed to save role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f4f2] px-4 py-12">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#DC2626]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#0b1e3a]/[0.06] blur-3xl" />
      <div className="relative w-full max-w-4xl animate-fade-up">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-soft">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold text-slate-900">
            Omni<span className="text-[#DC2626]">Stud</span>
          </span>
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Select Your Role</h1>
          <p className="mt-2 text-slate-600">Choose how you&apos;ll use OmniStud to tailor your experience</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#DC2626]"></div>
            <div className="h-0.5 w-8 bg-[#DC2626]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#DC2626]"></div>
            <div className="h-0.5 w-8 bg-slate-200"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
          </div>
        </div>

        {error && <Alert variant="error" className="mb-6 max-w-2xl mx-auto">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id && selectedLabel === role.label;
            return (
              <button
                key={role.label}
                onClick={() => handleSelect(role)}
                className={`relative flex items-start gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-[#DC2626]/60 bg-[#DC2626]/[0.04] shadow-lift"
                    : "border-slate-200/60 bg-white shadow-soft hover:border-slate-300 hover:shadow-lift"
                }`}
              >
                <div
                  className="flex-shrink-0 p-3 rounded-xl"
                  style={{ backgroundColor: `${role.color}15`, color: role.color }}
                >
                  {role.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${isSelected ? "text-[#DC2626]" : "text-slate-900"}`}>
                      {role.label}
                    </h3>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-[#DC2626] flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{role.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.features.map((feature) => (
                      <span key={feature} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/register")}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Back
          </button>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#DC2626]">
              <HelpCircle className="h-4 w-4" /> Help Selecting a Role?
            </button>
            <Button onClick={handleContinue} isLoading={isLoading} size="lg">
              Set My Role & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
