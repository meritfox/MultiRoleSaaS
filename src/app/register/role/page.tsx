"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { updateUserProfile } from "@/lib/auth-utils";
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
    color: "#3b4cca",
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
      const updateData: any = { role: selectedRole };
      if (providerType) {
        updateData.providerType = providerType;
      }
      await updateUserProfile(firebaseUser.uid, updateData);
      await refreshUser();
      router.push("/register/subscription");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-4xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Select Your Role</h1>
          <p className="mt-2 text-slate-600">Choose how you'll use OmniStud to tailor your experience</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
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
                className={`relative flex items-start gap-4 p-6 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#3b4cca] bg-[#3b4cca]/5 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
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
                    <h3 className={`text-lg font-bold ${isSelected ? "text-[#3b4cca]" : "text-slate-900"}`}>
                      {role.label}
                    </h3>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-[#3b4cca] flex items-center justify-center">
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
            <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#3b4cca]">
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
