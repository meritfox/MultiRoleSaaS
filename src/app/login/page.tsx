"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth-utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { DEMO_CREDENTIALS } from "@/lib/demo-data";
import { Mail, Lock, Eye, EyeOff, Smartphone } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: keyof typeof DEMO_CREDENTIALS) => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6] mb-4">
          <span className="text-2xl font-bold text-white">O</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-slate-600">Log in to your OmniStud account</p>
      </div>

      <Card className="w-full">
        {successMessage && (
          <Alert variant="success" className="mb-6">
            {successMessage}
          </Alert>
        )}
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

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
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-slate-600">
              <input type="checkbox" className="mr-2 rounded border-slate-300 text-[#3b4cca] focus:ring-[#3b4cca]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-[#3b4cca] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Log In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Don't have an account? </span>
          <Link href="/register" className="font-medium text-[#3b4cca] hover:underline">
            Sign up
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(DEMO_CREDENTIALS) as Array<keyof typeof DEMO_CREDENTIALS>).map(
              (role) => (
                <Button
                  key={role}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials(role)}
                >
                  {role === "admin" && "Admin"}
                  {role === "teacher" && "Teacher"}
                  {role === "transporter" && "Transporter"}
                  {role === "student" && "Student"}
                  {role === "parent" && "Parent"}
                </Button>
              )
            )}
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Click any role to auto-fill. Password: demo123
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<Card className="w-full max-w-md p-8 text-center">Loading...</Card>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
