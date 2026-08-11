"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { ServiceRequest, Service, StudentProfile } from "@/types";
import { updateServiceRequestStatus } from "@/lib/services/services";
import { Check, X, User } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

interface RequestWithDetails extends ServiceRequest {
  serviceName: string;
  servicePrice: number;
  studentName: string;
  studentEmail: string;
}

export default function ProviderRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(requestsRef, where("providerId", "==", user.uid));
        const requestsSnap = await getDocs(q);

        const requestsWithDetails: RequestWithDetails[] = [];

        for (const requestDoc of requestsSnap.docs) {
          const request = { id: requestDoc.id, ...requestDoc.data() } as ServiceRequest;

          // Fetch service details
          const serviceDoc = await getDoc(doc(db, "services", request.serviceId));
          const serviceData = serviceDoc.exists()
            ? (serviceDoc.data() as Service)
            : null;

          // Fetch student details
          const studentDoc = await getDoc(doc(db, "users", request.studentId));
          const studentData = studentDoc.exists()
            ? (studentDoc.data() as StudentProfile)
            : null;

          requestsWithDetails.push({
            ...request,
            serviceName: serviceData?.name || "Unknown Service",
            servicePrice: serviceData?.price || 0,
            studentName: studentData?.displayName || "Unknown Student",
            studentEmail: studentData?.email || "",
          });
        }

        setRequests(requestsWithDetails);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load service requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      const request = requests.find((r) => r.id === requestId);
      await updateServiceRequestStatus(requestId, newStatus, request?.serviceName);

      setRequests(
        requests.map((r) =>
          r.id === requestId ? { ...r, status: newStatus } : r
        )
      );

      setSuccess(`Request ${newStatus.toLowerCase()} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating request:", err);
      setError("Failed to update request status.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Service Requests" />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>
            <p className="text-gray-600">Manage requests from students.</p>
          </div>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}
          {success && <Alert variant="success" className="mb-6">{success}</Alert>}

          {requests.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No service requests yet.</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{request.serviceName}</h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            request.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : request.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        From: {request.studentName} ({request.studentEmail})
                      </p>
                      <p className="text-sm font-medium text-blue-600">₹{request.servicePrice}</p>
                    </div>

                    {request.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(request.id, "REJECTED")}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus(request.id, "APPROVED")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
