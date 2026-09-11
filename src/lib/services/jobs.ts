import { db, ensureFirebaseInit } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Job } from "@/types";
import { distanceKm } from "./geo";

// Lazy getter so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getJobsRef = () => {
  ensureFirebaseInit();
  return collection(db, "jobs");
};

export async function getJobs(): Promise<Job[]> {
  const snap = await getDocs(
    query(getJobsRef(), where("status", "==", "OPEN"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job);
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const snap = await getDoc(doc(getJobsRef(), jobId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() }) as Job : null;
}

export async function getJobsByPoster(posterId: string): Promise<Job[]> {
  const q = query(getJobsRef(), where("posterId", "==", posterId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job);
}

export async function createJob(
  posterId: string,
  data: Omit<Job, "id" | "posterId" | "status" | "createdAt">
): Promise<Job> {
  const payload = { ...data, posterId, status: "OPEN" as const, createdAt: Date.now() };
  const docRef = await addDoc(getJobsRef(), payload);
  return { id: docRef.id, ...payload } as Job;
}

export async function updateJob(jobId: string, data: Partial<Omit<Job, "id" | "posterId">>): Promise<void> {
  await updateDoc(doc(getJobsRef(), jobId), data);
}

export async function closeJob(jobId: string): Promise<void> {
  await updateDoc(doc(getJobsRef(), jobId), { status: "CLOSED" });
}

export { distanceKm };
