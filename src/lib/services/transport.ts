import { db, ensureFirebaseInit } from "@/lib/firebase";
import { collection, doc, addDoc, getDocs, query, where, orderBy, updateDoc, onSnapshot, Timestamp } from "firebase/firestore";

export interface TransportCheckIn {
  id: string;
  providerId: string;
  studentId?: string;
  type: "CHECK_IN" | "CHECK_OUT";
  location?: { lat: number; lng: number };
  note?: string;
  timestamp: number;
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
