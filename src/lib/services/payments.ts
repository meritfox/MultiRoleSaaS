import { db } from "@/lib/firebase";
import { collection, doc, addDoc, getDocs, query, where, updateDoc, getDoc, orderBy } from "firebase/firestore";
import { Payment, EscrowTransaction, SubscriptionPlan, SubscriptionBilling, UserProfile } from "@/types";
export type { EscrowTransaction };

const paymentsRef = collection(db, "payments");
const escrowRef = collection(db, "escrow");
const settingsRef = doc(collection(db, "settings"), "app_settings");

export async function createRegistrationPayment(
  userId: string,
  amount: number,
  plan?: SubscriptionPlan,
  billing?: SubscriptionBilling
): Promise<Payment> {
  const payload: Omit<Payment, "id"> = {
    userId,
    amount,
    status: "COMPLETED",
    createdAt: Date.now(),
    paymentMethod: "Demo Gateway",
    plan,
    billing,
  };
  const docRef = await addDoc(paymentsRef, payload);
  return { id: docRef.id, ...payload };
}

export async function getPaymentsByUser(userId: string): Promise<Payment[]> {
  const q = query(paymentsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
}

export async function getPlatformCommissionRate(): Promise<number> {
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    const data = snap.data();
    return typeof data.platformCommission === "number" ? data.platformCommission : 5;
  }
  return 5;
}

export async function createEscrowTransaction(
  payerId: string,
  providerId: string,
  serviceName: string,
  amount: number
): Promise<EscrowTransaction> {
  const commissionRate = await getPlatformCommissionRate();
  const commission = Math.round((amount * commissionRate) / 100);
  const payload: Omit<EscrowTransaction, "id"> = {
    payerId,
    providerId,
    amount,
    commission,
    status: "HELD",
    serviceName,
    createdAt: Date.now(),
  };
  const docRef = await addDoc(escrowRef, payload);
  return { id: docRef.id, ...payload };
}

export async function getEscrowByPayer(payerId: string): Promise<EscrowTransaction[]> {
  const q = query(escrowRef, where("payerId", "==", payerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EscrowTransaction);
}

export async function getEscrowByProvider(providerId: string): Promise<EscrowTransaction[]> {
  const q = query(escrowRef, where("providerId", "==", providerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EscrowTransaction);
}

export async function getAllEscrowTransactions(): Promise<EscrowTransaction[]> {
  const snap = await getDocs(query(escrowRef, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EscrowTransaction);
}

export async function releaseEscrow(transactionId: string) {
  const ref = doc(escrowRef, transactionId);
  await updateDoc(ref, { status: "RELEASED", releasedAt: Date.now() });
}

export async function refundEscrow(transactionId: string) {
  const ref = doc(escrowRef, transactionId);
  await updateDoc(ref, { status: "REFUNDED", releasedAt: Date.now() });
}
