"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { AuthShell } from "@/components/layout/AuthShell";
import { updateUserProfile, UserProfileUpdate } from "@/lib/auth-utils";
import { createChildProfileForParent, generateStudentIdCode } from "@/lib/services/users";
import { createTransportRequirement } from "@/lib/services/transport";
import { ParentStep, ParentStepData } from "@/components/onboarding/ParentStep";
import { ChildStep, ChildStepData } from "@/components/onboarding/ChildStep";
import { TransportStep, TransportStepData } from "@/components/onboarding/TransportStep";
import { User, HeartHandshake } from "lucide-react";

export default function ProfileSetupPage() {
  const { user, firebaseUser, role, refreshUser } = useAuth();
  const router = useRouter();

  const isParent = role === "PARENT";
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parentData, setParentData] = useState<ParentStepData>({
    title: "Mr",
    displayName: firebaseUser?.displayName || "",
    phoneNumber: "",
    email: firebaseUser?.email || "",
    address: "",
    state: "Jharkhand",
    city: "Jamshedpur",
    pincode: "831001",
    relationship: "Father",
    profession: "Salaried / Corporate Professional",
    qualification: "Graduate / Bachelor's (B.Tech, B.Sc, B.Com, B.A, etc.)",
  });

  const [childData, setChildData] = useState<ChildStepData>({
    displayName: "",
    photoURL: "",
    dateOfBirth: "",
    grade: "Class 6",
    school: "DAV Public School, Bistupur",
    customSchool: "",
    board: "CBSE",
    campus: "Main Campus",
    gender: "Male",
    age: 11,
    hobby: "Cricket / Football / Outdoor Sports",
    studentIdCode: generateStudentIdCode(),
  });

  const [transportData, setTransportData] = useState<TransportStepData>({
    needTransport: "YES",
    pickupLocation: "Bistupur Market Circle",
    dropLocation: "DAV Public School Campus Gate",
    morningPickup: true,
    afternoonDrop: true,
    preferredPickupTime: "07:15 AM",
    preferredDropTime: "01:45 PM",
    currentProvider: "",
    startDate: new Date().toISOString().split("T")[0],
    specialRequirement: "",
  });

  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  if (user && user.uid !== syncedUserId) {
    setSyncedUserId(user.uid);
    setParentData((prev) => ({
      ...prev,
      displayName: prev.displayName || user.displayName || "",
      phoneNumber: user.phoneNumber || prev.phoneNumber,
      email: user.email || prev.email,
    }));
  }

  const validateParentStep = () => {
    if (!parentData.displayName.trim()) return "Please enter your full name.";
    if (!parentData.phoneNumber.trim()) return "Please enter your phone number.";
    if (!parentData.state.trim()) return "Please select your state.";
    if (!parentData.city.trim()) return "Please select your city.";
    if (!parentData.address.trim()) return "Please enter your address.";
    return null;
  };

  const validateChildStep = () => {
    if (!childData.displayName.trim()) return "Please enter your child's full name.";
    if (!childData.grade) return "Please select class / grade.";
    const school = childData.school === "Other School (Specify)" ? childData.customSchool : childData.school;
    if (!school?.trim()) return "Please specify the school name.";
    return null;
  };

  const handleNextFromParent = () => {
    setError(null);
    const err = validateParentStep();
    if (err) {
      setError(err);
      return;
    }
    if (!isParent) {
      handleFinalSubmit();
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromChild = () => {
    setError(null);
    const err = validateChildStep();
    if (err) {
      setError(err);
      return;
    }
    if (!transportData.pickupLocation && parentData.address) {
      setTransportData((prev) => ({ ...prev, pickupLocation: parentData.address }));
    }
    const school = childData.school === "Other School (Specify)" ? childData.customSchool : childData.school;
    if (school) {
      setTransportData((prev) => ({ ...prev, dropLocation: `${school} Campus` }));
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firebaseUser) {
      setError("You must be logged in to complete setup.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isParent) {
        const parentUpdate: UserProfileUpdate = {
          displayName: parentData.displayName.trim(),
          phoneNumber: parentData.phoneNumber.trim(),
          address: parentData.address.trim(),
          city: parentData.city.trim(),
          state: parentData.state.trim(),
          country: "India",
          pincode: parentData.pincode.trim(),
          title: parentData.title,
          relationship: parentData.relationship,
          profession: parentData.profession,
          qualification: parentData.qualification,
        };
        await updateUserProfile(firebaseUser.uid, parentUpdate);

        const school = childData.school === "Other School (Specify)" ? childData.customSchool : childData.school;
        const newChild = await createChildProfileForParent(firebaseUser.uid, {
          displayName: childData.displayName.trim(),
          grade: childData.grade,
          school: school.trim(),
          board: childData.board,
          campus: childData.campus.trim(),
          dateOfBirth: childData.dateOfBirth,
          gender: childData.gender,
          age: Number(childData.age) || undefined,
          hobby: childData.hobby,
          photoURL: childData.photoURL.trim(),
          studentIdCode: childData.studentIdCode,
        });

        if (transportData.needTransport === "YES" || transportData.needTransport === "NOT_SURE") {
          await createTransportRequirement({
            parentId: firebaseUser.uid,
            childId: newChild.uid,
            childName: childData.displayName.trim(),
            schoolName: school.trim(),
            city: parentData.city.trim(),
            state: parentData.state.trim(),
            needTransport: transportData.needTransport,
            pickupLocation: transportData.pickupLocation.trim() || parentData.address.trim(),
            dropLocation: transportData.dropLocation.trim() || school.trim(),
            morningPickup: transportData.morningPickup,
            afternoonDrop: transportData.afternoonDrop,
            preferredPickupTime: transportData.preferredPickupTime,
            preferredDropTime: transportData.preferredDropTime,
            currentProvider: transportData.currentProvider.trim(),
            startDate: transportData.startDate,
            specialRequirement: transportData.specialRequirement.trim(),
            status: "ACTIVE",
          });
        }

        await refreshUser();
        router.push("/parent/dashboard");
      } else {
        const updateData: UserProfileUpdate = {
          displayName: parentData.displayName.trim(),
          address: parentData.address.trim(),
          city: parentData.city.trim(),
          state: parentData.state.trim(),
          country: "India",
          pincode: parentData.pincode.trim(),
        };
        if (parentData.phoneNumber.trim()) {
          updateData.phoneNumber = parentData.phoneNumber.trim();
        }
        await updateUserProfile(firebaseUser.uid, updateData);
        await refreshUser();
        router.push(role === "STUDENT" ? "/student/dashboard" : "/provider/dashboard");
      }
    } catch (err: unknown) {
      console.error("Profile setup failed:", err);
      setError((err as { message?: string })?.message || "Failed to complete setup.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthShell maxWidth="max-w-2xl">
      <div className="w-full">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-soft text-white">
            {isParent ? <HeartHandshake className="h-6 w-6" /> : <User className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isParent ? "Parent & Child Registration" : "Complete Your Profile"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isParent
              ? "Register once to monitor your child, request transport, and manage school services."
              : "Tell us a bit more about yourself to personalize your experience."}
          </p>
        </div>

        {isParent && (
          <div className="mb-6 flex items-center justify-center gap-2">
            {[
              { num: 1, label: "Parent Details" },
              { num: 2, label: "Add Child" },
              { num: 3, label: "School Transport" },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      currentStep >= s.num
                        ? "bg-[#DC2626] text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {currentStep > s.num ? "✓" : s.num}
                  </span>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      currentStep === s.num ? "text-slate-900 font-bold" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-0.5 w-8 transition-colors ${
                      currentStep > s.num ? "bg-[#DC2626]" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <Card className="w-full">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          {(!isParent || currentStep === 1) && (
            <ParentStep
              data={parentData}
              onChange={setParentData}
              onNext={handleNextFromParent}
              isParent={isParent}
              isLoading={isLoading}
            />
          )}

          {isParent && currentStep === 2 && (
            <ChildStep
              data={childData}
              city={parentData.city}
              onChange={setChildData}
              onNext={handleNextFromChild}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {isParent && currentStep === 3 && (
            <TransportStep
              data={transportData}
              onChange={setTransportData}
              onSubmit={handleFinalSubmit}
              onBack={() => setCurrentStep(2)}
              isLoading={isLoading}
            />
          )}
        </Card>
      </div>
    </AuthShell>
  );
}
