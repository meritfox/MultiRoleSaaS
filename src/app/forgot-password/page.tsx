"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { resetPassword } from "@/lib/auth-utils";
import { validateEmail } from "@/lib/validation";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const emailError = touched ? validateEmail(email) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await resetPassword(email);
      setSuccessMessage("Password reset email sent. Please check your inbox.");
    } catch (err: unknown) {
      console.error(err);
      setError((err as { message?: string })?.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reset Password</h1>
          <p className="mt-2 text-slate-600">
            Enter your email and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <Card className="p-6 md:p-8">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}
          {successMessage && <Alert variant="success" className="mb-6">{successMessage}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              error={emailError ?? undefined}
              placeholder="you@example.com"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
            />
            
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Send Reset Link
            </Button>
          </form>
        </Card>
      </div>
    </AuthShell>
  );
}
