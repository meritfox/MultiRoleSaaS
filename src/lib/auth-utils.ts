import { auth, db, ensureFirebaseInit } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { UserProfile, PaymentStatus } from "@/types";

export type RegisterProfileInput = Omit<UserProfile, "uid"> & Record<string, unknown>;
export type UserProfileUpdate = Partial<UserProfile> & Record<string, unknown>;

export const login = async (email: string, pass: string) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  return await signInWithEmailAndPassword(auth, email, pass);
};

// ---------------------------------------------------------------------------
// Google sign-in
// ---------------------------------------------------------------------------

export const loginWithGoogle = async () => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return await signInWithPopup(auth, provider);
};

/**
 * Creates a base Firestore profile for a first-time Google user so the
 * onboarding flow (/register/role -> subscription -> payment) can update it.
 * Defaults to the STUDENT role; the user picks their real role on the next
 * screen. Optional fields are only written when present because Firestore
 * rejects `undefined` values.
 */
export const createGoogleUserProfile = async (user: FirebaseUser): Promise<void> => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const profile: Record<string, unknown> = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName?.trim() || "New User",
    role: "STUDENT",
    paymentStatus: "PENDING",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (user.photoURL) profile.photoURL = user.photoURL;
  if (user.phoneNumber) profile.phoneNumber = user.phoneNumber;
  await setDoc(doc(db, "users", user.uid), profile);
};

export const resetPassword = async (email: string) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const { sendPasswordResetEmail } = await import("firebase/auth");
  return await sendPasswordResetEmail(auth, email);
};

/** Maps Firebase email/password sign-in error codes to friendly messages. */
export const getEmailAuthErrorMessage = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password. Please try again.";
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Unable to log in. Please try again.";
  }
};

/** Maps Firebase registration errors to friendly product messaging. */
export const getRegistrationErrorMessage = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead, or use Forgot Password to recover your account.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Your password is too weak. Use at least 8 characters with a number and special character.";
    case "auth/network-request-failed":
      return "Network issue detected. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts from this device. Please wait a moment and try again.";
    default:
      return (err as { message?: string })?.message || "Registration failed. Please try again.";
  }
};

/**
 * Maps Firebase Google sign-in error codes to friendly messages.
 * Returns an empty string when the user simply cancelled the popup so the
 * caller can fail silently.
 */
export const getGoogleAuthErrorMessage = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Please allow popups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in. Add it in the Firebase Console (Authentication > Settings > Authorized domains).";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Google sign-in failed. Please try again.";
  }
};

export const logout = async () => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  return await signOut(auth);
};

export const register = async (
  email: string, 
  pass: string, 
  profile: RegisterProfileInput
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
  data: UserProfileUpdate
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

// ---------------------------------------------------------------------------
// Phone OTP helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a user-entered phone number to E.164 format.
 * Plain 10-digit numbers are treated as Indian numbers (+91).
 */
export const normalizePhoneNumber = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};

/** Validates E.164 format (+ followed by 8-15 digits, no leading zero). */
export const isValidPhoneNumber = (raw: string): boolean => {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhoneNumber(raw));
};

/** Maps Firebase phone-auth error codes to user-friendly messages. */
export const getPhoneAuthErrorMessage = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "Invalid phone number. Use international format, e.g. +91 98765 43210.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP. Please check the code and try again.";
    case "auth/code-expired":
      return "The OTP has expired. Please request a new one.";
    case "auth/credential-already-in-use":
      return "This phone number is already linked to another account.";
    case "auth/provider-already-linked":
      return "A phone number is already linked to this account.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Please try again.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    default:
      return "Something went wrong. Please try again.";
  }
};

/** Safely clears a reCAPTCHA verifier so a new one can be created. */
export const clearRecaptcha = (verifier: RecaptchaVerifier | null) => {
  if (!verifier) return;
  try {
    verifier.clear();
  } catch {
    // Verifier may already be cleared - safe to ignore.
  }
};

/**
 * Sends an OTP to LINK a phone number to the currently signed-in user.
 * Linking ensures that a later "Sign in with phone" resolves to this
 * same account (same uid) instead of creating a separate one.
 */
export const sendPhoneLinkOTP = async (phoneNumber: string, verifier: RecaptchaVerifier) => {
  if (!ensureFirebaseInit()) throw new Error("Firebase is not initialized. Check your environment variables.");
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to link a phone number.");
  return await linkWithPhoneNumber(user, phoneNumber, verifier);
};

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
