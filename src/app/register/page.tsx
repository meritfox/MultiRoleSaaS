"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  register,
  normalizePhoneNumber,
  isValidPhoneNumber,
  setupRecaptcha,
  sendPhoneLinkOTP,
  clearRecaptcha,
  getPhoneAuthErrorMessage,
} from "@/lib/auth-utils";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { UserRole } from "@/types";
import { recordReferralSignup } from "@/lib/services/engagement";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AppSettings } from "@/types";
import { User, Mail, Lock, Shield, GraduationCap, Users, BookOpen, Bus, Building2, Phone, KeyRound } from "lucide-react";

const ROLES: { label: string; value: UserRole; icon: React.ReactNode; description: string }[] = [
  { 
    label: "Student", 
    value: "STUDENT", 
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Access learning resources and services"
  },
  { 
    label: "Parent", 
    value: "PARENT", 
    icon: <Users className="h-5 w-5" />,
    description: "Monitor children and manage payments"
  },
  { 
    label: "Teacher / Institution", 
    value: "SERVICE_PROVIDER", 
    icon: <BookOpen className="h-5 w-5" />,
    description: "Offer educational services"
  },
  { 
    label: "Transporter", 
    value: "SERVICE_PROVIDER", 
    icon: <Bus className="h-5 w-5" />,
    description: "Provide school transport services"
  },
  { 
    label: "Super Admin", 
    value: "SUPER_ADMIN", 
    icon: <Shield className="h-5 w-5" />,
    description: "Platform administration access"
  },
];

const PROVIDER_TYPES = [
  { label: "Teacher / Tutor", value: "TEACHER", icon: <BookOpen className="h-4 w-4" /> },
  { label: "School / Institution", value: "INSTITUTION", icon: <Building2 className="h-4 w-4" /> },
  { label: "Transporter / Driver", value: "TRANSPORTER", icon: <Bus className="h-4 w-4" /> },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [providerType, setProviderType] = useState("TEACHER");
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpRequestedRef = useRef(false);
  const router = useRouter();
  const [referrerId, setReferrerId] = useState<string | null>(null);

  // Capture the Refer & Earn referral id from /register?ref=<uid>.
  // Read from window.location so this page doesn't need a Suspense boundary.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only API after mount
    if (ref) setReferrerId(ref);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "app_settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
      } catch (err: unknown) {
        const error = err as { code?: string };
        if (error?.code === "permission-denied") {
          console.warn("Settings fetch blocked by Firestore rules; using defaults.");
        } else {
          console.error("Error fetching settings:", err);
        }
      }
    };
    fetchSettings();
  }, []);

  const validateStep1 = () => {
    if (!displayName.trim()) return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (!phoneNumber.trim()) return "Phone number is required";
    if (!isValidPhoneNumber(phoneNumber)) return "Enter a valid phone number (e.g. +91 98765 43210)";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (role === "SUPER_ADMIN") {
        let currentKey = "ADMIN123";
        try {
          const settingsRef = doc(db, "settings", "app_settings");
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            currentKey = (settingsSnap.data() as AppSettings).adminKey;
          }
        } catch (err: unknown) {
          const error = err as { code?: string };
          if (error?.code !== "permission-denied") {
            console.error("Error validating admin key:", err);
          }
        }
        if (adminKey !== currentKey) {
          throw new Error("Invalid admin key. Please contact the platform owner.");
        }
      }

      const profile: any = {
        email,
        displayName,
        phoneNumber: normalizePhoneNumber(phoneNumber),
        role,
        paymentStatus: "PENDING",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (role === "SERVICE_PROVIDER") {
        profile.providerType = providerType;
        profile.bio = "";
        profile.rating = 0;
        profile.services = [];
        profile.earnings = 0;
      } else if (role === "PARENT") {
        profile.children = [];
      } else if (role === "STUDENT") {
        profile.assignedServices = [];
      }

      const newUser = await register(email, password, profile);
      // Attribute the signup to the referrer (Refer & Earn). Non-blocking:
      // a referral failure must never break registration.
      if (referrerId && newUser?.uid && referrerId !== newUser.uid) {
        try {
          await recordReferralSignup(referrerId, {
            uid: newUser.uid,
            email,
            displayName,
          });
        } catch (refErr) {
          console.warn("Failed to record referral:", refErr);
        }
      }
      // Move to phone verification - the OTP is auto-sent once step 3 renders
      // (the invisible reCAPTCHA needs its container to exist in the DOM).
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Sends the phone-linking OTP. Runs automatically when step 3 mounts and
  // manually via the "Resend OTP" button. Linking the phone to the freshly
  // created account ensures "Sign in with phone" resolves to this same user.
  const sendLinkOtp = async () => {
    setOtpLoading(true);
    setError(null);
    try {
      clearRecaptcha(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = setupRecaptcha("register-recaptcha");
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA is unavailable. Please refresh the page.");
      }
      const result = await sendPhoneLinkOTP(
        normalizePhoneNumber(phoneNumber),
        recaptchaVerifierRef.current
      );
      setConfirmationResult(result);
    } catch (err: any) {
      console.error(err);
      clearRecaptcha(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = null;
      setError(
        err.message?.startsWith("reCAPTCHA") ? err.message : getPhoneAuthErrorMessage(err)
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // Auto-send the OTP once step 3 (and its reCAPTCHA container) has rendered.
  useEffect(() => {
    if (step === 3 && !otpRequestedRef.current) {
      otpRequestedRef.current = true;
      void sendLinkOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Clean up the reCAPTCHA verifier on unmount.
  useEffect(() => {
    return () => clearRecaptcha(recaptchaVerifierRef.current);
  }, []);

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!confirmationResult) {
      setError("OTP has not been sent yet. Please wait or tap Resend OTP.");
      return;
    }
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    try {
      await confirmationResult.confirm(otp.trim());
      setSuccess(true);
      setTimeout(() => {
        router.push("/register/role");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(getPhoneAuthErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSkipVerification = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push("/register/role");
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Account Created!</h2>
            <p className="text-slate-600">Let's set up your profile and choose your plan.</p>
            <Button asChild>
              <Link href="/register/role">Continue Setup</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#ef4444] mb-4">
            <span className="text-2xl font-bold text-white">O</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-600">Join the OmniStud education ecosystem</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${step >= 1 ? "bg-[#DC2626]" : "bg-slate-300"}`}></div>
            <div className="h-0.5 w-8 bg-slate-200"></div>
            <div className={`h-2.5 w-2.5 rounded-full ${step >= 2 ? "bg-[#DC2626]" : "bg-slate-300"}`}></div>
            <div className="h-0.5 w-8 bg-slate-200"></div>
            <div className={`h-2.5 w-2.5 rounded-full ${step >= 3 ? "bg-[#DC2626]" : "bg-slate-300"}`}></div>
          </div>
        </div>

        <Card className="w-full">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
              {referrerId && (
                <Alert variant="success">
                  You were referred by a friend — welcome to OmniStud!
                </Alert>
              )}
              <Input
                label="Full Name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                icon={<User className="h-4 w-4" />}
              />
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Phone Number"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                icon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
              />
              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
              />

              <Button type="submit" className="w-full" size="lg">
                Continue
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-600">Already have an account? </span>
                <Link href="/login" className="font-medium text-[#DC2626] hover:underline">
                  Log in
                </Link>
              </div>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">I am registering as</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        role === r.value
                          ? "border-[#DC2626] bg-[#DC2626]/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${role === r.value ? "bg-[#DC2626] text-white" : "bg-slate-100 text-slate-600"}`}>
                        {r.icon}
                      </div>
                      <div>
                        <p className={`font-medium ${role === r.value ? "text-[#DC2626]" : "text-slate-900"}`}>{r.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {role === "SERVICE_PROVIDER" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Service Provider Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROVIDER_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setProviderType(type.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm transition-all ${
                          providerType === type.value
                            ? "border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        {type.icon}
                        <span className="text-xs font-medium text-center">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {role === "SUPER_ADMIN" && (
                <Input
                  label="Admin Key"
                  type="password"
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  icon={<Shield className="h-4 w-4" />}
                />
              )}

              <div className="rounded-lg bg-red-50 p-4 text-sm text-[#DC2626]">
                <p className="font-medium">Registration fee: ₹{settings?.registrationFee || 100}</p>
                <p className="text-xs mt-1 text-red-700">Demo payment - no real charges applied</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  Create Account
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhone} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DC2626]/10">
                  <Phone className="h-6 w-6 text-[#DC2626]" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Verify your phone</h2>
                <p className="text-sm text-slate-600">
                  We sent a 6-digit OTP to{" "}
                  <span className="font-medium">{normalizePhoneNumber(phoneNumber)}</span>.
                  Verifying links this number to your account so you can also log in with OTP.
                </p>
              </div>

              <Input
                label="One-Time Password (OTP)"
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                icon={<KeyRound className="h-4 w-4" />}
              />

              {/* Mount point for the invisible reCAPTCHA used by phone auth */}
              <div id="register-recaptcha"></div>

              <Button type="submit" className="w-full" size="lg" isLoading={otpLoading}>
                Verify & Continue
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={sendLinkOtp}
                  disabled={otpLoading}
                  className="font-medium text-[#DC2626] hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={handleSkipVerification}
                  className="text-slate-500 hover:underline"
                >
                  Skip for now
                </button>
              </div>
              <p className="text-center text-xs text-slate-400">
                Skipping means phone OTP login won&apos;t work for this account.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
