import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableNetwork } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Live bindings that are initialized lazily so the build/static generation
// does not require Firebase environment variables to be present.
let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;
let storage!: FirebaseStorage;

let initialized = false;

const getFirebaseConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

export function ensureFirebaseInit(): boolean {
  if (initialized) return true;

  // Never initialize Firebase during SSR / static generation.
  if (typeof window === "undefined") {
    return false;
  }

  const config = getFirebaseConfig();
  if (!config.apiKey) {
    console.warn(
      "[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is missing. " +
        "Firebase services will not be available. " +
        "Add your Firebase config to Vercel Environment Variables."
    );
    return false;
  }

  app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Ensure Firestore network is enabled (helpful if it was disabled in a previous session)
  enableNetwork(db).catch((err) => {
    console.warn("Failed to enable Firestore network:", err);
  });

  initialized = true;
  return true;
}

export { app, auth, db, storage };
