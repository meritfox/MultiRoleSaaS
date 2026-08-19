import { db, ensureFirebaseInit } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { ServiceCatalogItem } from "@/types";

// Lazy getter so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getCatalogRef = () => {
  ensureFirebaseInit();
  return collection(db, "serviceCatalog");
};

export async function getCatalogItems(): Promise<ServiceCatalogItem[]> {
  const snap = await getDocs(query(getCatalogRef(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceCatalogItem);
}

export async function createCatalogItem(
  data: Omit<ServiceCatalogItem, "id" | "createdAt" | "active">
): Promise<ServiceCatalogItem> {
  const payload = { ...data, active: true, createdAt: Date.now() };
  const docRef = await addDoc(getCatalogRef(), payload);
  return { id: docRef.id, ...payload } as ServiceCatalogItem;
}

export async function updateCatalogItem(
  itemId: string,
  data: Partial<Omit<ServiceCatalogItem, "id">>
): Promise<void> {
  await updateDoc(doc(getCatalogRef(), itemId), data);
}

export async function deleteCatalogItem(itemId: string): Promise<void> {
  await deleteDoc(doc(getCatalogRef(), itemId));
}

export async function toggleCatalogItemActive(itemId: string, active: boolean): Promise<void> {
  await updateDoc(doc(getCatalogRef(), itemId), { active });
}
