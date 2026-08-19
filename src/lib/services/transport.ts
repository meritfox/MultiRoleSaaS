import { db, ensureFirebaseInit } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { createNotification } from "./services";

export interface TransportCheckIn {
  id: string;
  providerId: string;
  studentId?: string;
  type: "CHECK_IN" | "CHECK_OUT";
  location?: { lat: number; lng: number };
  note?: string;
  timestamp: number;
}

/** Live GPS position of a transporter's vehicle, doc id = providerId. */
export interface LiveLocation {
  providerId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  active: boolean;
  note?: string;
  updatedAt: number;
}

// Lazy getter so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getCheckinsRef = () => {
  ensureFirebaseInit();
  return collection(db, "transportCheckIns");
};

export async function recordCheckIn(
  providerId: string,
  data: Omit<TransportCheckIn, "id" | "providerId" | "timestamp">
): Promise<TransportCheckIn> {
  const payload = { ...data, providerId, timestamp: Date.now() };
  const docRef = await addDoc(getCheckinsRef(), payload);
  return { id: docRef.id, ...payload };
}

export async function getCheckInsByProvider(providerId: string): Promise<TransportCheckIn[]> {
  const q = query(getCheckinsRef(), where("providerId", "==", providerId), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TransportCheckIn);
}

export async function getCheckInsByStudent(studentId: string): Promise<TransportCheckIn[]> {
  const q = query(getCheckinsRef(), where("studentId", "==", studentId), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TransportCheckIn);
}

export function subscribeToStudentCheckIns(studentId: string, callback: (checkIns: TransportCheckIn[]) => void) {
  const q = query(getCheckinsRef(), where("studentId", "==", studentId), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TransportCheckIn));
  });
}

export async function deleteCheckIn(checkInId: string): Promise<void> {
  await deleteDoc(doc(getCheckinsRef(), checkInId));
}

// ---------------------------------------------------------------------------
// Live vehicle location (one doc per transporter, id = providerId)
// ---------------------------------------------------------------------------

const getLiveLocationRef = (providerId: string) => {
  ensureFirebaseInit();
  return doc(db, "transportLiveLocations", providerId);
};

export async function updateLiveLocation(
  providerId: string,
  coords: { lat: number; lng: number; accuracy?: number },
  note?: string
): Promise<void> {
  const payload: LiveLocation = {
    providerId,
    lat: coords.lat,
    lng: coords.lng,
    accuracy: coords.accuracy,
    active: true,
    note,
    updatedAt: Date.now(),
  };
  await setDoc(getLiveLocationRef(providerId), payload);
}

export async function stopLiveLocation(providerId: string): Promise<void> {
  const ref = getLiveLocationRef(providerId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(ref, { ...(snap.data() as LiveLocation), active: false, updatedAt: Date.now() });
  }
}

export async function getLiveLocation(providerId: string): Promise<LiveLocation | null> {
  const snap = await getDoc(getLiveLocationRef(providerId));
  return snap.exists() ? (snap.data() as LiveLocation) : null;
}

export function subscribeToLiveLocation(
  providerId: string,
  callback: (location: LiveLocation | null) => void
) {
  return onSnapshot(getLiveLocationRef(providerId), (snap) => {
    callback(snap.exists() ? (snap.data() as LiveLocation) : null);
  });
}

// ---------------------------------------------------------------------------
// Parent alerts: notify the parent of the checked student (pickup/drop)
// ---------------------------------------------------------------------------

export async function notifyParentOfCheckIn(checkIn: TransportCheckIn): Promise<void> {
  if (!checkIn.studentId) return;
  try {
    const studentSnap = await getDoc(doc(collection(db, "users"), checkIn.studentId));
    if (!studentSnap.exists()) return;
    const parentId = (studentSnap.data() as { parentId?: string }).parentId;
    if (!parentId) return;

    const studentName = (studentSnap.data() as { displayName?: string }).displayName || "Your child";
    const isPickup = checkIn.type === "CHECK_IN";

    await createNotification({
      userId: parentId,
      title: `${studentName} ${isPickup ? "picked up" : "dropped off"}`,
      message: `${studentName} was ${isPickup ? "picked up" : "dropped off"} by the transport.${
        checkIn.location
          ? ` Location: ${checkIn.location.lat.toFixed(4)}, ${checkIn.location.lng.toFixed(4)}.`
          : ""
      }${checkIn.note ? ` Note: ${checkIn.note}` : ""}`,
      type: isPickup ? "SUCCESS" : "INFO",
    });
  } catch (err) {
    console.warn("Failed to notify parent of check-in:", err);
  }
}
