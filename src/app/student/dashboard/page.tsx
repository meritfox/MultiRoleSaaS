"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Service, ServiceRequest } from "@/types";
import { getAllServices, createServiceRequest, getRequestsByStudent } from "@/lib/services/services";
import { Search, BookOpen, Bus, ShoppingCart, Briefcase, CreditCard, Gift, MapPin, Star, Map, Wallet } from "lucide-react";
import Link from "next/link";

const STUDENT_ROLE = "STUDENT" as const;

export default function StudentDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);

        if (user) {
          const requestsData = await getRequestsByStudent(user.uid);
          setMyRequests(requestsData);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load available services.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAvailService = async (service: Service) => {
    if (!user) return;
    setRequestingId(service.id);
    setError(null);
    setSuccess(null);

    try {
      const newRequest = await createServiceRequest(user.uid, service);
      setMyRequests([...myRequests, newRequest]);
      setSuccess(`Service "${service.name}" requested successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error requesting service:", err);
      setError("Failed to request service. Please try again.");
    } finally {
      setRequestingId(null);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.providerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRequestStatus = (serviceId: string) => {
    const request = myRequests.find((r) => r.serviceId === serviceId);
    return request?.status;
  };

  const tutorServices = filteredServices.filter((s) => s.providerType === "TEACHER").slice(0, 2);
  const transportServices = filteredServices.filter((s) => s.providerType === "TRANSPORTER").slice(0, 2);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Student Dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.displayName?.split(" ")[0]}!</h2>
              <p className="text-slate-600">What would you like to do today?</p>
            </div>
            <div className="relative max-w-md w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tutors, transport, marketplace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca]"
              />
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Find Tutor */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-[#3b4cca]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#3b4cca]">Discovery - Tutor</span>
                  </div>
                  <h3 className="font-bold text-slate-900">Find a Tutor / Institution</h3>
                  <p className="text-sm text-slate-600 mt-1">Subject, Area, Hobby, Review search.</p>
                  <div className="mt-3 space-y-2">
                    {tutorServices.length > 0 ? (
                      tutorServices.map((service) => (
                        <div key={service.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-700">{service.name}</span>
                          <span className="font-medium text-[#3b4cca]">₹{service.price}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No tutors available</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Math Tutor, Science Class..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca]"
                    />
                    <Button size="sm">Search</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* School Transport */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                  <Bus className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Discovery - Transport</span>
                  </div>
                  <h3 className="font-bold text-slate-900">School Transportation</h3>
                  <p className="text-sm text-slate-600 mt-1">Search for Bus, Car, Van, Auto with reviews.</p>
                  <div className="mt-3 space-y-2">
                    {transportServices.length > 0 ? (
                      transportServices.map((service) => (
                        <div key={service.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                          <span className="text-slate-700">{service.name}</span>
                          <span className="font-medium text-amber-600">₹{service.price}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No transport available</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="mt-3" asChild>
                    <Link href="/student/dashboard/transport">View Map</Link>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Marketplace */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">Marketplace & Book Resale</h3>
                  <p className="text-sm text-slate-600 mt-1">Sell & Buy old textbooks and needed items.</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Algebra 1 Textbook</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> School Bag, Guwahati</li>
                  </ul>
                  <Button size="sm" variant="outline" className="mt-3">Browse Items</Button>
                </div>
              </div>
            </Card>

            {/* Job Board */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">Job Board & Gig Requests</h3>
                  <p className="text-sm text-slate-600 mt-1">Find local student jobs and requests.</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> GhyPrep Delivery Gig</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> Tutor request, GuwahatiPrep</li>
                  </ul>
                  <Button size="sm" variant="outline" className="mt-3">View Gigs</Button>
                </div>
              </div>
            </Card>

            {/* Linked Services */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-100 text-red-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">My Linked Services (Tracking)</h3>
                  <p className="text-sm text-slate-600 mt-1">Follow your linked students and services.</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Unique link: omnis.st/99</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Contest entry confirmed.</li>
                  </ul>
                  <Button size="sm" variant="outline" className="mt-3">Track Now</Button>
                </div>
              </div>
            </Card>

            {/* Escrow Payments */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyan-100 text-cyan-600">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">OmniStud Escrow Payments</h3>
                  <p className="text-sm text-slate-600 mt-1">Manage secure payments (% commission detail).</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Transactions</span>
                      <span className="font-medium text-slate-900">3 Active</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Status</span>
                      <span className="font-medium text-emerald-600">Secured</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">View Payments</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* All Services */}
          <Card title="All Available Services" description="Browse and request services">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">No services available at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => {
                  const requestStatus = getRequestStatus(service.id);
                  return (
                    <div key={service.id} className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 capitalize">
                          {service.providerType}
                        </span>
                        <span className="text-lg font-bold text-[#3b4cca]">₹{service.price}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900">{service.name}</h3>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{service.description}</p>
                      {service.rating && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span>{service.rating}</span>
                          <span className="text-slate-400">({service.reviews || 0} reviews)</span>
                        </div>
                      )}
                      <div className="mt-4">
                        {requestStatus ? (
                          <span
                            className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                              requestStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : requestStatus === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {requestStatus === "PENDING" && "Request Pending"}
                            {requestStatus === "APPROVED" && "Request Approved"}
                            {requestStatus === "REJECTED" && "Request Rejected"}
                          </span>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleAvailService(service)}
                            isLoading={requestingId === service.id}
                          >
                            Request Service
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
