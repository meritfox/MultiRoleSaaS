import { db, ensureFirebaseInit } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { UserProfile, StudentProfile, ParentProfile, UserRole } from "@/types";

// Lazy getter so the module can be imported during static generation
// without requiring Firebase to be initialized.
const getUsersRef = () => {
  ensureFirebaseInit();
  return collection(db, "users");
};

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(getUsersRef());
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getUsersRef(), uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() }) as UserProfile : null;
}

export async function updateUserRole(uid: string, role: UserRole) {
  await updateDoc(doc(getUsersRef(), uid), { role, updatedAt: Date.now() });
}

export async function toggleUserBlock(uid: string, blocked: boolean) {
  await updateDoc(doc(getUsersRef(), uid), { blocked, updatedAt: Date.now() });
}

export async function deleteUserAccount(uid: string) {
  await deleteDoc(doc(getUsersRef(), uid));
}

export async function linkChildToParent(parentUid: string, childEmail: string): Promise<StudentProfile | null> {
  const q = query(getUsersRef(), where("email", "==", childEmail), where("role", "==", "STUDENT"));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const childDoc = snap.docs[0];
  const childId = childDoc.id;

  await updateDoc(doc(getUsersRef(), parentUid), {
    children: arrayUnion(childId),
    updatedAt: Date.now(),
  });
  await updateDoc(doc(getUsersRef(), childId), {
    parentId: parentUid,
    updatedAt: Date.now(),
  });

  return { uid: childId, ...childDoc.data() } as StudentProfile;
}

export async function unlinkChildFromParent(parentUid: string, childId: string) {
  await updateDoc(doc(getUsersRef(), parentUid), {
    children: arrayRemove(childId),
    updatedAt: Date.now(),
  });
  await updateDoc(doc(getUsersRef(), childId), {
    parentId: null,
    updatedAt: Date.now(),
  });
}

export async function getChildrenProfiles(parentUid: string): Promise<StudentProfile[]> {
  const parentSnap = await getDoc(doc(getUsersRef(), parentUid));
  if (!parentSnap.exists()) return [];
  const parentData = parentSnap.data() as ParentProfile;
  const childrenIds = parentData.children || [];
  if (childrenIds.length === 0) return [];

  const children: StudentProfile[] = [];
  for (const childId of childrenIds) {
    const childSnap = await getDoc(doc(getUsersRef(), childId));
    if (childSnap.exists()) {
      children.push({ uid: childSnap.id, ...childSnap.data() } as StudentProfile);
    }
  }
  return children;
}


export interface CreateChildInput {
  displayName: string;
  grade?: string;
  school?: string;
  board?: string;
  campus?: string;
  dateOfBirth?: string;
  gender?: string;
  age?: number;
  hobby?: string;
  photoURL?: string;
  studentIdCode?: string;
}

export function generateStudentIdCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `OS-${year}-${rand}`;
}

export async function createChildProfileForParent(
  parentUid: string,
  childData: CreateChildInput
): Promise<StudentProfile> {
  const usersRef = getUsersRef();
  const childIdCode = childData.studentIdCode?.trim() || generateStudentIdCode();
  const childDocRef = doc(usersRef);
  const childUid = childDocRef.id;

  const childProfile: StudentProfile = {
    uid: childUid,
    email: `${childIdCode.toLowerCase().replace(/[^a-z0-9]/g, "")}@student.omnistud.internal`,
    displayName: childData.displayName.trim(),
    role: "STUDENT",
    parentId: parentUid,
    grade: childData.grade || "",
    school: childData.school || "",
    board: childData.board || "CBSE",
    campus: childData.campus || "",
    studentIdCode: childIdCode,
    dateOfBirth: childData.dateOfBirth || "",
    gender: childData.gender || "",
    age: childData.age || undefined,
    hobby: childData.hobby || "",
    photoURL: childData.photoURL || "",
    isManagedChild: true,
    assignedServices: [],
    paymentStatus: "COMPLETED",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Add the child document into Firestore
  const { setDoc } = await import("firebase/firestore");
  await setDoc(childDocRef, childProfile);

  // Link child ID into parent document
  await updateDoc(doc(usersRef, parentUid), {
    children: arrayUnion(childUid),
    updatedAt: Date.now(),
  });

  return childProfile;
}

export async function linkChildByStudentCode(
  parentUid: string,
  searchQuery: string
): Promise<StudentProfile | null> {
  const qClean = searchQuery.trim();
  if (!qClean) return null;

  // Search by studentIdCode or email
  let q = query(getUsersRef(), where("studentIdCode", "==", qClean));
  let snap = await getDocs(q);

  if (snap.empty) {
    q = query(getUsersRef(), where("email", "==", qClean), where("role", "==", "STUDENT"));
    snap = await getDocs(q);
  }

  if (snap.empty) {
    // Also try matching by name case-insensitively across students
    const allStudentsSnap = await getDocs(query(getUsersRef(), where("role", "==", "STUDENT")));
    const matched = allStudentsSnap.docs.find(
      (d) => (d.data() as StudentProfile).displayName?.toLowerCase() === qClean.toLowerCase()
    );
    if (matched) {
      const childId = matched.id;
      await updateDoc(doc(getUsersRef(), parentUid), {
        children: arrayUnion(childId),
        updatedAt: Date.now(),
      });
      await updateDoc(doc(getUsersRef(), childId), {
        parentId: parentUid,
        updatedAt: Date.now(),
      });
      return { uid: childId, ...matched.data() } as StudentProfile;
    }
    return null;
  }

  const childDoc = snap.docs[0];
  const childId = childDoc.id;

  await updateDoc(doc(getUsersRef(), parentUid), {
    children: arrayUnion(childId),
    updatedAt: Date.now(),
  });
  await updateDoc(doc(getUsersRef(), childId), {
    parentId: parentUid,
    updatedAt: Date.now(),
  });

  return { uid: childId, ...childDoc.data() } as StudentProfile;
}

