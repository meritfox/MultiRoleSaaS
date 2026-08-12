import { auth, db, ensureFirebaseInit } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { UserProfile, PaymentStatus } from "@/types";

export const login = async (email: string, pass: string) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logout = async () => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  return await signOut(auth);
};

export const register = async (
  email: string, 
  pass: string, 
  profile: UserProfile
) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Update auth profile
  await updateProfile(user, {
    displayName: profile.displayName,
    photoURL: profile.photoURL || undefined,
  });

  // Create Firestore profile
  await setDoc(doc(db, "users", user.uid), {
    ...profile,
    uid: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return userCredential.user;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: Date.now(),
  });
};

export const updatePaymentStatus = async (
  uid: string,
  status: PaymentStatus
) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    paymentStatus: status,
    updatedAt: Date.now(),
  });
};

export const updateSubscription = async (
  uid: string,
  plan: string,
  billing: string
) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    subscriptionPlan: plan,
    subscriptionBilling: billing,
    paymentStatus: "COMPLETED",
    updatedAt: Date.now(),
  });
};

// Phone OTP helpers
export const setupRecaptcha = (containerId: string) => {
  if (typeof window === "undefined") return null;
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      // Reset reCAPTCHA
    },
  });
  return verifier;
};

export const sendPhoneOTP = async (phoneNumber: string, verifier: RecaptchaVerifier) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const verifyPhoneOTP = async (verificationId: string, otp: string) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  return await signInWithCredential(auth, credential);
};
