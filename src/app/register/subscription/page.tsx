"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { updateSubscription } from "@/lib/auth-utils";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { SubscriptionConfig, SubscriptionBilling } from "@/types";
import { Check, Sparkles, CreditCard, Calendar, HelpCircle } from "lucide-react";

export default function SubscriptionPage() {
  const { firebaseUser, refreshUser } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<SubscriptionBilling>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRef = collection(db, "subscriptionPlans");
        const snap = await getDocs(plansRef);
        const data = snap.docs.map((d) => d.data() as SubscriptionConfig);
        setPlans(data.sort((a, b) => a.monthlyPrice - b.monthlyPrice));
      } catch (err) {
        console.error("Error fetching plans:", err);
        // Fallback plans
        setPlans([
          {
            plan: "BASIC",
            name: "OmniBasic Student",
            monthlyPrice: 15,
            yearlyPrice: 144,
            features: ["Search for tutors", "View basic transport routes", "Access book marketplace"],
            color: "#3b4cca",
          },
          {
            plan: "PRO",
            name: "OmniPro Family",
            monthlyPrice: 30,
            yearlyPrice: 288,
            features: ["All Basic features", "Unlimited tutor searches", "Live GPS transport tracking", "Ad-free marketplace listings", "Priority booking"],
            popular: true,
            color: "#f59e0b",
          },
          {
            plan: "ENTERPRISE",
            name: "OmniSchool Partner",
            monthlyPrice: 200,
            yearlyPrice: 1920,
            features: ["School-wide access", "Bulk accounts", "Integrated school transport", "Administrative dashboard", "Custom feature requests"],
            color: "#7c3aed",
          },
        ]);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = (plan: string) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleCompletePayment = async () => {
    if (!selectedPlan || !firebaseUser) {
      setError("Please select a plan");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await updateSubscription(firebaseUser.uid, selectedPlan, billing);
      await refreshUser();
      router.push("/register/profile");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPrice = (plan: SubscriptionConfig) => {
    return billing === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-6xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Select Your Subscription Plan</h1>
          <p className="mt-2 text-slate-600">Choose the plan that fits your needs</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setBilling("MONTHLY")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billing === "MONTHLY" ? "bg-[#3b4cca] text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("YEARLY")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billing === "YEARLY" ? "bg-[#3b4cca] text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yearly
              <span className={`text-xs px-2 py-0.5 rounded-full ${billing === "YEARLY" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {error && <Alert variant="error" className="mb-6 max-w-2xl mx-auto">{error}</Alert>}

        {!showPayment ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.plan;
                const price = getPrice(plan);
                return (
                  <div
                    key={plan.plan}
                    className={`relative rounded-2xl border-2 bg-white p-6 transition-all ${
                      isSelected
                        ? "border-[#3b4cca] shadow-lg scale-[1.02]"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    } ${plan.popular ? "ring-2 ring-[#f59e0b]/20" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[#f59e0b] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline justify-center">
                        <span className="text-4xl font-bold" style={{ color: plan.color }}>
                          ${price}
                        </span>
                        <span className="text-slate-500 ml-1">/{billing === "MONTHLY" ? "month" : "year"}</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(plan.plan)}
                      className="w-full"
                      variant={isSelected ? "primary" : "outline"}
                      style={isSelected ? { backgroundColor: plan.color, borderColor: plan.color } : {}}
                    >
                      {isSelected ? "Selected" : "Subscribe"}
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <button
                onClick={() => router.push("/register/role")}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
              <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#3b4cca]">
                <HelpCircle className="h-4 w-4" /> Help Selecting a Plan?
              </button>
            </div>
          </>
        ) : (
          <Card className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#3b4cca]/10 mb-3">
                <CreditCard className="h-6 w-6 text-[#3b4cca]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Complete Payment</h3>
              <p className="text-sm text-slate-600 mt-1">
                Demo payment - no real charges
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Plan</span>
                <span className="font-medium text-slate-900">{plans.find((p) => p.plan === selectedPlan)?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Billing</span>
                <span className="font-medium text-slate-900 capitalize">{billing.toLowerCase()}</span>
              </div>
              <div className="border-t border-slate-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">Total</span>
                <span className="text-xl font-bold text-[#3b4cca]">
                  ${getPrice(plans.find((p) => p.plan === selectedPlan)!)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 border border-slate-200 rounded-lg flex items-center gap-3">
                <div className="h-8 w-12 bg-slate-200 rounded"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Demo Card</p>
                  <p className="text-xs text-slate-500">**** **** **** 4242</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleCompletePayment} isLoading={isLoading}>
                Complete Payment
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
