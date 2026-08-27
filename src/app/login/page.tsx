"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  login,
  logout,
  getUserProfile,
  normalizePhoneNumber,
  isValidPhoneNumber,
  setupRecaptcha,
  sendPhoneOTP,
  clearRecaptcha,
  getPhoneAuthErrorMessage,
} from "@/lib/auth-utils";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { DEMO_CREDENTIALS } from "@/lib/demo-data";
import { AuthShell } from "@/components/layout/AuthShell";
import { Mail, Lock, Eye, EyeOff, Smartphone, Phone, KeyRound } from "lucide-react";

const getDashboardPath = (role: UserRole | null | undefined): string => {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin/dashboard";
    case "SERVICE_PROVIDER":
      return "/provider/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    case "PARENT":
      return "/parent/dashboard";
    default:
      return "/";
  }
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();

  // Already authenticated -> go straight to the role dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getDashboardPath(role));
    }
  }, [authLoading, user, role, router]);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setSuccessMessage("Payment completed successfully! You can now log in.");
    }
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const credential = await login(email, password);
      const profile = await getUserProfile(credential.user.uid);
      router.replace(getDashboardPath(profile?.role));
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchLoginMethod = (method: "email" | "phone") => {
    setLoginMethod(method);
    setError(null);
    setSuccessMessage(null);
    setOtp("");
    setOtpSent(false);
    setConfirmationResult(null);
  };

  const handleSendOtp = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!isValidPhoneNumber(phoneNumber)) {
      setError("Enter a valid phone number (e.g. +91 98765 43210)");
      return;
    }
    setIsLoading(true);
    try {
      clearRecaptcha(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = setupRecaptcha("login-recaptcha");
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA is unavailable. Please refresh the page.");
      }
      const result = await sendPhoneOTP(normalizePhoneNumber(phoneNumber), recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setOtp("");
      setOtpSent(true);
      setSuccessMessage(`OTP sent to ${normalizePhoneNumber(phoneNumber)}`);
    } catch (err: any) {
      console.error(err);
      clearRecaptcha(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = null;
      setError(
        err.message?.startsWith("reCAPTCHA") ? err.message : getPhoneAuthErrorMessage(err)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!confirmationResult) {
      setError("Please request an OTP first.");
      return;
    }
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setIsLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp.trim());
      const profile = await getUserProfile(credential.user.uid);
      if (!profile) {
        // Phone auth succeeded but no OmniStud account uses this number.
        await logout();
        setOtpSent(false);
        setOtp("");
        setConfirmationResult(null);
        setError("No account is registered with this phone number. Please register first.");
        return;
      }
      router.replace(getDashboardPath(profile.role));
    } catch (err: any) {
      console.error(err);
      setError(getPhoneAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up the reCAPTCHA verifier on unmount.
  useEffect(() => {
    return () => clearRecaptcha(recaptchaVerifierRef.current);
  }, []);

  const fillDemoCredentials = (role: keyof typeof DEMO_CREDENTIALS) => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-slate-600">Log in to your OmniStud account to continue.</p>
      </div>

      <Card className="w-full">
        {/* Login method toggle */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => switchLoginMethod("email")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              loginMethod === "email"
                ? "bg-white text-[#DC2626] shadow-soft"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => switchLoginMethod("phone")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              loginMethod === "phone"
                ? "bg-white text-[#DC2626] shadow-soft"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Phone OTP
          </button>
        </div>

        {successMessage && (
          <Alert variant="success" className="mb-6">
            {successMessage}
          </Alert>
        )}
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {loginMethod === "email" ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-slate-400 transition-colors hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-slate-600">
              <input type="checkbox" className="mr-2 rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-[#DC2626] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Log In
          </Button>
        </form>
        ) : !otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <Input
            label="Phone Number"
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91 98765 43210"
            icon={<Phone className="h-4 w-4" />}
          />
          <p className="text-xs text-slate-500">
            We&apos;ll send a 6-digit OTP to this number via SMS.
          </p>
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Send OTP
          </Button>
        </form>
        ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <p className="text-center text-sm text-slate-600">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium">{normalizePhoneNumber(phoneNumber)}</span>
          </p>
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
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Verify & Log In
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setConfirmationResult(null);
                setSuccessMessage(null);
              }}
              className="text-slate-500 hover:underline"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isLoading}
              className="font-medium text-[#DC2626] hover:underline disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </form>
        )}

        {/* Mount point for the invisible reCAPTCHA used by phone auth */}
        <div id="login-recaptcha"></div>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Don't have an account? </span>
          <Link href="/register" className="font-medium text-[#DC2626] hover:underline">
            Sign up
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100/80">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Demo Login
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(DEMO_CREDENTIALS) as Array<keyof typeof DEMO_CREDENTIALS>).map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemoCredentials(role)}
                  className="rounded-full border border-slate-200/60 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-soft transition-all duration-200 hover:border-[#DC2626]/30 hover:text-[#DC2626] hover:shadow-lift active:scale-95"
                >
                  {role === "admin" && "Admin"}
                  {role === "teacher" && "Teacher"}
                  {role === "transporter" && "Transporter"}
                  {role === "student" && "Student"}
                  {role === "parent" && "Parent"}
                </button>
              )
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Click any role to auto-fill. Password: demo123
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Card className="w-full p-8 text-center text-slate-500">Loading...</Card>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
