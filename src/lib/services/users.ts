import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { UserProfile, StudentProfile, ParentProfile, UserRole } from "@/types";

const usersRef = collection(db, "users");

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(usersRef);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(usersRef, uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() }) as UserProfile : null;
}

export async function updateUserRole(uid: string, role: UserRole) {
  await updateDoc(doc(usersRef, uid), { role, updatedAt: Date.now() });
}

export async function toggleUserBlock(uid: string, blocked: boolean) {
  await updateDoc(doc(usersRef, uid), { blocked, updatedAt: Date.now() });
}

export async function deleteUserAccount(uid: string) {
  await deleteDoc(doc(usersRef, uid));
}

export async function linkChildToParent(parentUid: string, childEmail: string): Promise<StudentProfile | null> {
  const q = query(usersRef, where("email", "==", childEmail), where("role", "==", "STUDENT"));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const childDoc = snap.docs[0];
  const childId = childDoc.id;

  await updateDoc(doc(usersRef, parentUid), {
    children: arrayUnion(childId),
    updatedAt: Date.now(),
  });
  await updateDoc(doc(usersRef, childId), {
    parentId: parentUid,
    updatedAt: Date.now(),
  });

  return { uid: childId, ...childDoc.data() } as StudentProfile;
}

export async function unlinkChildFromParent(parentUid: string, childId: string) {
  await updateDoc(doc(usersRef, parentUid), {
    children: arrayRemove(childId),
    updatedAt: Date.now(),
  });
  await updateDoc(doc(usersRef, childId), {
    parentId: null,
    updatedAt: Date.now(),
  });
}

export async function getChildrenProfiles(parentUid: string): Promise<StudentProfile[]> {
  const parentSnap = await getDoc(doc(usersRef, parentUid));
  if (!parentSnap.exists()) return [];
  const parentData = parentSnap.data() as ParentProfile;
  const childrenIds = parentData.children || [];
  if (childrenIds.length === 0) return [];

  const children: StudentProfile[] = [];
  for (const childId of childrenIds) {
    const childSnap = await getDoc(doc(usersRef, childId));
    if (childSnap.exists()) {
      children.push({ uid: childSnap.id, ...childSnap.data() } as StudentProfile);
    }
  }
  return children;
}
