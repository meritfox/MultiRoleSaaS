"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { updateUserProfile } from "@/lib/auth-utils";
import { User, Phone, MapPin, Building2, GraduationCap, Bus, CreditCard } from "lucide-react";

export default function ProfileSetupPage() {
  const { firebaseUser, role, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: firebaseUser?.displayName || "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    grade: "",
    school: "",
    board: "CBSE",
    bio: "",
    institutionName: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      setError("You must be logged in to complete profile setup");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
      };

      if (role === "STUDENT") {
        updateData.grade = formData.grade;
        updateData.school = formData.school;
        updateData.board = formData.board;
      } else if (role === "SERVICE_PROVIDER") {
        updateData.bio = formData.bio;
        updateData.institutionName = formData.institutionName;
        updateData.vehicleType = formData.vehicleType;
        updateData.vehicleNumber = formData.vehicleNumber;
        updateData.licenseNumber = formData.licenseNumber;
      }

      await updateUserProfile(firebaseUser.uid, updateData);
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6] mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="mt-2 text-slate-600">Tell us a bit more about yourself</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
          </div>
        </div>

        <Card className="w-full">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Your full name"
                icon={<User className="h-4 w-4" />}
              />
              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="+91 98765 43210"
                icon={<Phone className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street address"
              icon={<MapPin className="h-4 w-4" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="City"
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="State"
              />
              <Input
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="Pincode"
              />
            </div>

            {role === "STUDENT" && (
              <div className="space-y-5 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[#3b4cca]" /> Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input
                    label="Grade / Class"
                    value={formData.grade}
                    onChange={(e) => handleChange("grade", e.target.value)}
                    placeholder="e.g. Grade 5"
                  />
                  <Input
                    label="School Name"
                    value={formData.school}
                    onChange={(e) => handleChange("school", e.target.value)}
                    placeholder="School name"
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Board</label>
                    <select
                      value={formData.board}
                      onChange={(e) => handleChange("board", e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca]"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="IB">IB</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {role === "SERVICE_PROVIDER" && (
              <div className="space-y-5 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" /> Provider Information
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Institution / Organization Name"
                    value={formData.institutionName}
                    onChange={(e) => handleChange("institutionName", e.target.value)}
                    placeholder="Your institution or business name"
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Bio / Description</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      placeholder="Tell us about your services..."
                      rows={3}
                      className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Vehicle Type"
                      value={formData.vehicleType}
                      onChange={(e) => handleChange("vehicleType", e.target.value)}
                      placeholder="e.g. School Bus"
                      icon={<Bus className="h-4 w-4" />}
                    />
                    <Input
                      label="Vehicle Number"
                      value={formData.vehicleNumber}
                      onChange={(e) => handleChange("vehicleNumber", e.target.value)}
                      placeholder="e.g. AS-01-AB-1234"
                    />
                    <Input
                      label="License Number"
                      value={formData.licenseNumber}
                      onChange={(e) => handleChange("licenseNumber", e.target.value)}
                      placeholder="License number"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/register/subscription")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" isLoading={isLoading} size="lg">
                Complete Setup
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
