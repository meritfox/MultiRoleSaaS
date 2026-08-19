import { db, ensureFirebaseInit } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Referral, FeedbackEntry, ContestEntry } from "@/types";

// Lazy getters so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getReferralsRef = () => {
  ensureFirebaseInit();
  return collection(db, "referrals");
};
const getFeedbackRef = () => {
  ensureFirebaseInit();
  return collection(db, "feedback");
};
const getContestRef = () => {
  ensureFirebaseInit();
  return collection(db, "contestEntries");
};

// ---------------------------------------------------------------------------
// Refer & Earn
// ---------------------------------------------------------------------------

/** Short human-friendly code derived from the user id (display only). */
export function getReferralCode(userId: string): string {
  return userId.slice(0, 8).toUpperCase();
}

/**
 * Unique referral link. The full uid is passed as `ref` so signups can be
 * attributed back to the referrer when the new account is created.
 */
export function getReferralLink(userId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/register?ref=${userId}`;
  }
  return `/register?ref=${userId}`;
}

/** Called right after a referred user finishes registration. */
export async function recordReferralSignup(
  referrerId: string,
  referee: { uid: string; email?: string; displayName?: string }
): Promise<void> {
  await addDoc(getReferralsRef(), {
    referrerId,
    refereeId: referee.uid,
    refereeEmail: referee.email,
    refereeName: referee.displayName,
    status: "SIGNED_UP",
    commission: 0,
    createdAt: Date.now(),
  } satisfies Omit<Referral, "id">);
}

export async function getMyReferrals(referrerId: string): Promise<Referral[]> {
  const q = query(
    getReferralsRef(),
    where("referrerId", "==", referrerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Referral);
}

// ---------------------------------------------------------------------------
// Feedback / Suggestions (+ automatic prize contest entry)
// ---------------------------------------------------------------------------

export function currentContestMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function submitFeedback(
  userId: string,
  data: { message: string; rating?: number; userName?: string }
): Promise<FeedbackEntry> {
  const payload = {
    userId,
    userName: data.userName,
    message: data.message,
    rating: data.rating,
    createdAt: Date.now(),
  };
  const docRef = await addDoc(getFeedbackRef(), payload);
  const feedback = { id: docRef.id, ...payload } as FeedbackEntry;

  // Each feedback submission counts as one entry into the monthly prize draw.
  await addDoc(getContestRef(), {
    userId,
    userName: data.userName,
    feedbackId: docRef.id,
    month: currentContestMonth(),
    createdAt: Date.now(),
  } satisfies Omit<ContestEntry, "id">);

  return feedback;
}

export async function getMyFeedback(userId: string): Promise<FeedbackEntry[]> {
  const q = query(getFeedbackRef(), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeedbackEntry);
}

// ---------------------------------------------------------------------------
// Monthly prize contest
// ---------------------------------------------------------------------------

export async function getMyContestEntries(
  userId: string,
  month?: string
): Promise<ContestEntry[]> {
  const targetMonth = month ?? currentContestMonth();
  const q = query(
    getContestRef(),
    where("userId", "==", userId),
    where("month", "==", targetMonth),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ContestEntry);
}
