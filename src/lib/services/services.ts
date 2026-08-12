import { db, ensureFirebaseInit } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Service, ServiceRequest, ServiceProviderProfile, Notification } from "@/types";

// Lazy getters so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getServicesRef = () => {
  ensureFirebaseInit();
  return collection(db, "services");
};
const getRequestsRef = () => {
  ensureFirebaseInit();
  return collection(db, "serviceRequests");
};
const getNotificationsRef = () => {
  ensureFirebaseInit();
  return collection(db, "notifications");
};

export async function getAllServices(): Promise<Service[]> {
  const snap = await getDocs(query(getServicesRef(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
}

export async function getServicesByProvider(providerId: string): Promise<Service[]> {
  const q = query(getServicesRef(), where("providerId", "==", providerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
}

export async function getServiceById(serviceId: string): Promise<Service | null> {
  const snap = await getDoc(doc(getServicesRef(), serviceId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() }) as Service : null;
}

export async function createService(providerId: string, data: Omit<Service, "id" | "providerId" | "createdAt" | "updatedAt">) {
  const payload = {
    ...data,
    providerId,
    rating: data.rating ?? 0,
    reviews: data.reviews ?? 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const docRef = await addDoc(getServicesRef(), payload);
  return { id: docRef.id, ...payload } as Service;
}

export async function updateService(serviceId: string, data: Partial<Omit<Service, "id" | "providerId">>) {
  await updateDoc(doc(getServicesRef(), serviceId), { ...data, updatedAt: Date.now() });
}

export async function deleteService(serviceId: string) {
  await deleteDoc(doc(getServicesRef(), serviceId));
}

export async function createServiceRequest(studentId: string, service: Service) {
  const existing = await getDocs(
    query(getRequestsRef(), where("serviceId", "==", service.id), where("studentId", "==", studentId))
  );
  if (!existing.empty) {
    throw new Error("You have already requested this service.");
  }

  const payload: Omit<ServiceRequest, "id"> = {
    serviceId: service.id,
    studentId,
    providerId: service.providerId,
    status: "PENDING",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const docRef = await addDoc(getRequestsRef(), payload);

  // Notify provider
  await createNotification({
    userId: service.providerId,
    title: "New Service Request",
    message: `A student requested ${service.name}.`,
    type: "INFO",
  });

  return { id: docRef.id, ...payload } as ServiceRequest;
}

export async function getRequestsByProvider(providerId: string): Promise<(ServiceRequest & { service?: Service; student?: any })[]> {
  const q = query(getRequestsRef(), where("providerId", "==", providerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceRequest);
  return Promise.all(
    reqs.map(async (r) => {
      const [serviceSnap, studentSnap] = await Promise.all([
        getDoc(doc(getServicesRef(), r.serviceId)),
        getDoc(doc(collection(db, "users"), r.studentId)),
      ]);
      return {
        ...r,
        service: serviceSnap.exists() ? ({ id: serviceSnap.id, ...serviceSnap.data() } as Service) : undefined,
        student: studentSnap.exists() ? studentSnap.data() : undefined,
      };
    })
  );
}

export async function getRequestsByStudent(studentId: string): Promise<(ServiceRequest & { service?: Service })[]> {
  const q = query(getRequestsRef(), where("studentId", "==", studentId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceRequest);
  return Promise.all(
    reqs.map(async (r) => {
      const serviceSnap = await getDoc(doc(getServicesRef(), r.serviceId));
      return {
        ...r,
        service: serviceSnap.exists() ? ({ id: serviceSnap.id, ...serviceSnap.data() } as Service) : undefined,
      };
    })
  );
}

export async function updateServiceRequestStatus(requestId: string, status: "APPROVED" | "REJECTED", serviceName?: string) {
  const ref = doc(getRequestsRef(), requestId);
  await updateDoc(ref, { status, updatedAt: Date.now() });

  // Notify student
  const reqSnap = await getDoc(ref);
  if (reqSnap.exists()) {
    const req = reqSnap.data() as ServiceRequest;
    await createNotification({
      userId: req.studentId,
      title: status === "APPROVED" ? "Service Request Approved" : "Service Request Rejected",
      message: `Your request for ${serviceName || "a service"} was ${status.toLowerCase()}.`,
      type: status === "APPROVED" ? "SUCCESS" : "WARNING",
    });
  }
}

export async function createNotification(data: Omit<Notification, "id" | "read" | "createdAt">) {
  const payload = { ...data, read: false, createdAt: Date.now() };
  const docRef = await addDoc(getNotificationsRef(), payload);
  return { id: docRef.id, ...payload } as Notification;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(getNotificationsRef(), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification);
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(getNotificationsRef(), notificationId), { read: true });
}

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const q = query(getNotificationsRef(), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification));
  });
}
