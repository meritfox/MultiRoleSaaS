"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { AppSettings } from "@/types";
import { createRegistrationPayment } from "@/lib/services/payments";
import { AuthShell } from "@/components/layout/AuthShell";
import Image from "next/image";

export default function PaymentPage() {
  const { user, firebaseUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "app_settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleCompleteDemoPayment = async () => {
    if (!firebaseUser) {
      setError("You must be logged in to complete payment.");
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate a delay for payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Persist demo payment record and mark user as paid
      await createRegistrationPayment(firebaseUser.uid, registrationFee);
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        paymentStatus: "COMPLETED",
        updatedAt: Date.now(),
      });

      router.push("/login?payment=success");
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const registrationFee = settings?.registrationFee || 100;
  const upiId = "demo@razorpay";
  const payeeName = "RBAC SaaS Demo";
  const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    payeeName
  )}&am=${registrationFee}&cu=INR&tn=${encodeURIComponent(
    "Registration Fee"
  )}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrData
  )}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f2] px-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthShell maxWidth="max-w-md">
      <Card className="w-full text-center">
        <div className="space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#B91C1C] shadow-soft">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Complete Registration
            </h2>
            <p className="text-sm text-slate-600">
              To activate your account, please complete the registration fee
              payment of{" "}
              <span className="font-semibold text-slate-900">
                ₹{registrationFee}
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6">
            <p className="mb-4 text-sm font-medium text-slate-700">
              Scan this demo Razorpay QR code with any UPI app
            </p>
            <div className="relative mx-auto h-[250px] w-[250px] overflow-hidden rounded-xl bg-white shadow-soft">
              <Image
                src={qrImageUrl}
                alt="Demo Razorpay QR Code"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="mt-4 space-y-1 text-xs text-slate-500">
              <p>UPI ID: {upiId}</p>
              <p>Amount: ₹{registrationFee}</p>
              <p>This is a demo payment - no real money will be deducted.</p>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            className="w-full"
            onClick={handleCompleteDemoPayment}
            isLoading={isProcessing}
          >
            I Have Completed the Demo Payment
          </Button>

          <p className="text-xs text-slate-400">
            For demo purposes, clicking the button above simulates a successful
            payment.
          </p>
        </div>
      </Card>
    </AuthShell>
  );
}
