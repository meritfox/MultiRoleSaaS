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
import { MarketplaceItem } from "@/types";
import { getUserById } from "./users";

// Lazy getter so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getItemsRef = () => {
  ensureFirebaseInit();
  return collection(db, "marketplaceItems");
};

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  const snap = await getDocs(
    query(getItemsRef(), where("status", "==", "ACTIVE"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MarketplaceItem);
}

export async function getItemById(itemId: string): Promise<MarketplaceItem | null> {
  const snap = await getDoc(doc(getItemsRef(), itemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() }) as MarketplaceItem : null;
}

export async function getItemsBySeller(sellerId: string): Promise<MarketplaceItem[]> {
  const q = query(getItemsRef(), where("sellerId", "==", sellerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MarketplaceItem);
}

export async function createMarketplaceItem(
  sellerId: string,
  data: Omit<MarketplaceItem, "id" | "sellerId" | "status" | "createdAt">
): Promise<MarketplaceItem> {
  const seller = await getUserById(sellerId).catch(() => null);
  const payload = {
    ...data,
    sellerId,
    sellerName: data.sellerName ?? seller?.displayName,
    sellerPhone: data.sellerPhone ?? seller?.phoneNumber,
    status: "ACTIVE" as const,
    createdAt: Date.now(),
  };
  const docRef = await addDoc(getItemsRef(), payload);
  return { id: docRef.id, ...payload } as MarketplaceItem;
}

export async function updateMarketplaceItem(
  itemId: string,
  data: Partial<Omit<MarketplaceItem, "id" | "sellerId">>
): Promise<void> {
  await updateDoc(doc(getItemsRef(), itemId), data);
}

export async function markItemSold(itemId: string): Promise<void> {
  await updateDoc(doc(getItemsRef(), itemId), { status: "SOLD" });
}
