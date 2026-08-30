"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  login,
  logout,
  getUserProfile,
  loginWithGoogle,
  createGoogleUserProfile,
  getEmailAuthErrorMessage,
  getGoogleAuthErrorMessage,
  normalizePhoneNumber,
  isValidPhoneNumber,
  setupRecaptcha,
  sendPhoneOTP,
  clearRecaptcha,
  getPhoneAuthErrorMessage,
} from "@/lib/auth-utils";
import { validateEmail, validateLoginPassword, validatePhone } from "@/lib/validation";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { AuthShell } from "@/components/layout/AuthShell";
import { Mail, Lock, Eye, EyeOff, Smartphone, Phone, KeyRound } from "lucide-react";

/** Official Google "G" mark, per Google's brand guidelines. */
function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Inline field-level validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const showError = (field: string) => touched[field] || submitAttempted;
  const emailError = showError("email") ? validateEmail(email) : null;
  const passwordError = showError("password") ? validateLoginPassword(password) : null;
  const phoneError = showError("phone") ? validatePhone(phoneNumber, isValidPhoneNumber) : null;

  // Already authenticated -> go straight to the role dashboard.
  // Skipped while a Google flow is in flight so a first-time Google user is
  // not redirected before we finish routing them to onboarding.
  useEffect(() => {
    if (!authLoading && user && !googleLoading) {
      router.replace(getDashboardPath(role));
    }
  }, [authLoading, user, role, router, googleLoading]);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setSuccessMessage("Payment completed successfully! You can now log in.");
    }
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please log in.");
    }
  }, [searchParams]);

  const markTouched = (field: string) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitAttempted(true);

    if (validateEmail(email) || validateLoginPassword(password)) return;

    setIsLoading(true);
    try {
      const credential = await login(email.trim(), password);
      const profile = await getUserProfile(credential.user.uid);
      router.replace(getDashboardPath(profile?.role));
    } catch (err: any) {
      console.error(err);
      setError(getEmailAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setGoogleLoading(true);
    try {
      const credential = await loginWithGoogle();
      const profile = await getUserProfile(credential.user.uid);
      if (profile) {
        router.replace(getDashboardPath(profile.role));
      } else {
        // First-time Google user: create a base profile, then let them pick
        // their role, plan and complete payment like any other signup.
        await createGoogleUserProfile(credential.user);
        router.replace("/register/role");
      }
      // Keep googleLoading true while navigating so the auto-redirect effect
      // stays gated until this component unmounts.
    } catch (err: unknown) {
      console.error(err);
      const message = getGoogleAuthErrorMessage(err);
      if (message) setError(message); // empty message = user closed the popup
      setGoogleLoading(false);
    }
  };

  const switchLoginMethod = (method: "email" | "phone") => {
    setLoginMethod(method);
    setError(null);
    setSuccessMessage(null);
    setOtp("");
    setOtpSent(false);
    setConfirmationResult(null);
    setSubmitAttempted(false);
    setTouched({});
  };

  const handleSendOtp = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitAttempted(true);
    if (!isValidPhoneNumber(phoneNumber)) {
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

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-slate-600">Log in to your OmniStud account to continue.</p>
      </div>

      <Card className="w-full">
        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || isLoading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-soft transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-lift active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {googleLoading ? (
            <svg className="h-5 w-5 animate-spin text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          ) : (
            <GoogleMark />
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200/80" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            or continue with
          </span>
          <div className="h-px flex-1 bg-slate-200/80" />
        </div>

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
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            error={emailError ?? undefined}
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail className="h-4 w-4" />}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched("password")}
              error={passwordError ?? undefined}
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<Lock className="h-4 w-4" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
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

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading} disabled={googleLoading}>
            Log In
          </Button>
        </form>
        ) : !otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
          <Input
            label="Phone Number"
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onBlur={() => markTouched("phone")}
            error={phoneError ?? undefined}
            placeholder="+91 98765 43210"
            autoComplete="tel"
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
          <span className="text-slate-600">Don&apos;t have an account? </span>
          <Link href="/register" className="font-medium text-[#DC2626] hover:underline">
            Sign up
          </Link>
        </div>
      </Card>

      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        Secured by Firebase Authentication. By continuing you agree to our{" "}
        <Link href="/" className="underline hover:text-slate-500">Terms</Link> and{" "}
        <Link href="/" className="underline hover:text-slate-500">Privacy Policy</Link>.
      </p>
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
