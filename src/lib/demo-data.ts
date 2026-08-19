import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  Firestore,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ensureFirebaseInit, getFirebaseConfig } from "./firebase";
import { AppSettings, EscrowTransaction, Service, ServiceRequest, UserProfile } from "@/types";

export const DEMO_CREDENTIALS = {
  admin: { email: "admin@omnistud.com", password: "demo123", name: "OmniStud Admin" },
  teacher: { email: "teacher@omnistud.com", password: "demo123", name: "Demo Teacher" },
  transporter: { email: "transporter@omnistud.com", password: "demo123", name: "Demo Transporter" },
  student: { email: "student@omnistud.com", password: "demo123", name: "Demo Student" },
  parent: { email: "parent@omnistud.com", password: "demo123", name: "Demo Parent" },
};

export const DEFAULT_ADMIN_KEY = "ADMIN123";

export const SUBSCRIPTION_PLANS = [
  {
    plan: "BASIC",
    name: "OmniBasic Student",
    monthlyPrice: 15,
    yearlyPrice: 144,
    features: ["Search for tutors", "View basic transport routes", "Access book marketplace"],
    color: "#DC2626",
  },
  {
    plan: "PRO",
    name: "OmniPro Family",
    monthlyPrice: 30,
    yearlyPrice: 288,
    features: ["All Basic features", "Unlimited tutor searches", "Live GPS transport tracking", "Ad-free marketplace listings", "Priority booking"],
    popular: true,
    color: "#f59e0b",
  },
  {
    plan: "ENTERPRISE",
    name: "OmniSchool Partner",
    monthlyPrice: 200,
    yearlyPrice: 1920,
    features: ["School-wide access", "Bulk accounts", "Integrated school transport", "Administrative dashboard", "Custom feature requests"],
    color: "#7c3aed",
  },
];

type DemoRole = keyof typeof DEMO_CREDENTIALS;
type DemoCreds = (typeof DEMO_CREDENTIALS)[DemoRole];

// ---------------------------------------------------------------------------
// Secondary Firebase app used exclusively for demo seeding.
//
// Seeding must NEVER touch the primary `auth` instance: signIn / createUser
// calls fire `onAuthStateChanged` on the shared auth, which previously
// hijacked the real user's session (auto-login as a demo user on the login
// page, random account flips after logout). A secondary, named app gets its
// own isolated Auth + Firestore pipeline, so the main app's auth state is
// left completely untouched. The secondary auth also uses in-memory
// persistence so no demo session is ever written to browser storage.
// ---------------------------------------------------------------------------

const SEED_APP_NAME = "omnistud-demo-seeder";

let seedApp: FirebaseApp | null = null;
let seedAuth: Auth | null = null;
let seedDb: Firestore | null = null;

async function getSeedContext(): Promise<{ auth: Auth; db: Firestore }> {
  if (!ensureFirebaseInit()) {
    throw new Error("Firebase is not initialized; cannot seed demo data.");
  }
  const config = getFirebaseConfig();
  if (!config.apiKey) {
    throw new Error("Firebase config is missing; cannot seed demo data.");
  }

  if (!seedApp) {
    seedApp =
      getApps().find((existing) => existing.name === SEED_APP_NAME) ??
      initializeApp(config, SEED_APP_NAME);
  }
  if (!seedAuth) {
    seedAuth = getAuth(seedApp);
    // Never persist demo-seed sessions to browser storage.
    await setPersistence(seedAuth, inMemoryPersistence);
  }
  if (!seedDb) {
    seedDb = getFirestore(seedApp);
  }
  return { auth: seedAuth, db: seedDb };
}

/**
 * Signs in as the demo user on the SECONDARY auth, creating the account when
 * it does not exist yet. Returns the uid, or null when the account already
 * exists with a different password (e.g. changed through the demo UI).
 *
 * NOTE: on success the secondary auth stays signed in as this user, which is
 * required for the profile write below (rules: users.create needs isOwner).
 */
async function ensureDemoUser(seedAuth: Auth, creds: DemoCreds): Promise<string | null> {
  try {
    const credential = await signInWithEmailAndPassword(seedAuth, creds.email, creds.password);
    return credential.user.uid;
  } catch {
    // Account does not exist yet (or the password no longer matches) - try creating it.
  }

  try {
    const newUser = await createUserWithEmailAndPassword(seedAuth, creds.email, creds.password);
    await updateProfile(newUser.user, { displayName: creds.name });
    return newUser.user.uid;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/email-already-in-use") {
      console.warn(
        `[demo-seed] ${creds.email} already exists with a different password. Skipping this demo user.`
      );
      return null;
    }
    throw err;
  }
}

async function upsertDemoProfile(
  seedDb: Firestore,
  role: DemoRole,
  uid: string,
  creds: DemoCreds
): Promise<void> {
  const userRef = doc(seedDb, "users", uid);
  const userSnap = await getDoc(userRef);

  const baseProfile: Partial<UserProfile> = {
    uid,
    email: creds.email,
    displayName: creds.name,
    paymentStatus: "COMPLETED",
    subscriptionPlan:
      role === "parent" ? "PRO" : role === "student" ? "BASIC" : role === "admin" ? "ENTERPRISE" : "PRO",
    subscriptionBilling: "MONTHLY",
    isDemo: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    phoneNumber: "+91 98765 43210",
    address: "Guwahati, Assam, India",
    city: "Guwahati",
    state: "Assam",
    country: "India",
    pincode: "781001",
  };

  if (!userSnap.exists()) {
    if (role === "admin") {
      await setDoc(userRef, {
        ...baseProfile,
        role: "SUPER_ADMIN",
      });
    } else if (role === "teacher") {
      await setDoc(userRef, {
        ...baseProfile,
        role: "SERVICE_PROVIDER",
        providerType: "TEACHER",
        bio: "Experienced Mathematics and Science teacher with 10+ years of experience.",
        rating: 4.8,
        services: [],
        earnings: 45000,
        institutionName: "Guwahati Prep Academy",
      });
    } else if (role === "transporter") {
      await setDoc(userRef, {
        ...baseProfile,
        role: "SERVICE_PROVIDER",
        providerType: "TRANSPORTER",
        bio: "Reliable school transport service with GPS tracking.",
        rating: 4.6,
        services: [],
        earnings: 32000,
        vehicleType: "School Bus",
        vehicleNumber: "AS-01-AB-1234",
        licenseNumber: "DL-1234567890",
      });
    } else if (role === "student") {
      await setDoc(userRef, {
        ...baseProfile,
        role: "STUDENT",
        assignedServices: [],
        grade: "Grade 5",
        school: "Guwahati Prep School",
        board: "CBSE",
      });
    } else if (role === "parent") {
      await setDoc(userRef, {
        ...baseProfile,
        role: "PARENT",
        children: [],
      });
    }
  } else {
    await updateDoc(userRef, {
      paymentStatus: "COMPLETED",
      isDemo: true,
      updatedAt: Date.now(),
    });
  }
}

let seedPromise: Promise<void> | null = null;

/**
 * Seeds demo users and demo data. Safe to call on every app load:
 * - runs on a SECONDARY Firebase app, so it never touches the real auth session
 * - uses deterministic document ids, so re-runs never create duplicates
 * - concurrent calls share a single in-flight run
 */
export function seedDemoData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().finally(() => {
      seedPromise = null;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const { auth: seedAuth, db: seedDb } = await getSeedContext();

  const createdUsers: Record<string, string> = {};

  // Phase 1: ensure the demo Auth accounts exist and each one owns its
  // Firestore profile doc (rules: users.create requires isOwner).
  const entries = Object.entries(DEMO_CREDENTIALS) as Array<[DemoRole, DemoCreds]>;
  for (const [role, creds] of entries) {
    try {
      const uid = await ensureDemoUser(seedAuth, creds);
      if (!uid) continue;
      createdUsers[role] = uid;
      await upsertDemoProfile(seedDb, role, uid, creds);
    } catch (error) {
      console.error(`Error seeding ${role} demo user:`, error);
    }
  }

  // Phase 2: privileged seed data, written while signed in as the demo ADMIN
  // on the secondary auth (settings/plans/etc. are admin-only per the rules).
  try {
    await signInWithEmailAndPassword(
      seedAuth,
      DEMO_CREDENTIALS.admin.email,
      DEMO_CREDENTIALS.admin.password
    );
    await seedAdminData(seedDb, createdUsers);
  } catch (error) {
    console.warn("[demo-seed] Skipped admin-level demo data:", error);
  } finally {
    // Always leave the secondary auth signed out.
    await seedAuth.signOut().catch(() => undefined);
  }
}

async function seedAdminData(
  seedDb: Firestore,
  createdUsers: Record<string, string>
): Promise<void> {
  // Seed app settings if not present
  const settingsRef = doc(seedDb, "settings", "app_settings");
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    const defaultSettings: AppSettings = {
      registrationFee: 100,
      allowedServiceProviderTypes: ["teacher", "driver", "tutor", "institution"],
      maintenanceMode: false,
      adminKey: DEFAULT_ADMIN_KEY,
    };
    await setDoc(settingsRef, defaultSettings);
  }

  // Seed subscription plans
  for (const plan of SUBSCRIPTION_PLANS) {
    const planRef = doc(seedDb, "subscriptionPlans", plan.plan);
    const planSnap = await getDoc(planRef);
    if (!planSnap.exists()) {
      await setDoc(planRef, plan);
    }
  }

  // Link parent to student
  if (createdUsers.parent && createdUsers.student) {
    try {
      await updateDoc(doc(seedDb, "users", createdUsers.parent), {
        children: [createdUsers.student],
        updatedAt: Date.now(),
      });
      await updateDoc(doc(seedDb, "users", createdUsers.student), {
        parentId: createdUsers.parent,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error linking parent and student:", error);
    }
  }

  // Seed demo services (deterministic ids -> re-runs never duplicate).
  // `createdAt` is included so the docs appear in orderBy("createdAt") queries.
  const demoServices: Array<{ id: string; data: Omit<Service, "id"> & { createdAt: number } }> = [
    {
      id: "math_tutoring",
      data: {
        providerId: createdUsers.teacher || "teacher",
        name: "Math Tutoring - Grade 5",
        description: "Comprehensive mathematics tutoring for Grade 5 students covering arithmetic, geometry, and problem solving.",
        price: 2500,
        providerType: "TEACHER",
        category: "Tutoring",
        location: "Guwahati",
        rating: 4.8,
        reviews: 24,
        createdAt: Date.now() - 172800000,
      },
    },
    {
      id: "science_class",
      data: {
        providerId: createdUsers.teacher || "teacher",
        name: "Science Class - Grade 5",
        description: "Interactive science classes with practical experiments and conceptual learning.",
        price: 2000,
        providerType: "TEACHER",
        category: "Tutoring",
        location: "Guwahati",
        rating: 4.7,
        reviews: 18,
        createdAt: Date.now() - 172700000,
      },
    },
    {
      id: "bus_route_15",
      data: {
        providerId: createdUsers.transporter || "transporter",
        name: "School Bus Route #15",
        description: "Safe school transportation with GPS tracking, covering major areas of Guwahati.",
        price: 3500,
        providerType: "TRANSPORTER",
        category: "Transportation",
        location: "Guwahati",
        rating: 4.6,
        reviews: 32,
        createdAt: Date.now() - 172600000,
      },
    },
    {
      id: "van_route_3",
      data: {
        providerId: createdUsers.transporter || "transporter",
        name: "Van Route #3 - City Prep",
        description: "Door-to-door van service for City Prep School students with live tracking.",
        price: 2800,
        providerType: "TRANSPORTER",
        category: "Transportation",
        location: "Guwahati",
        rating: 4.5,
        reviews: 15,
        createdAt: Date.now() - 172500000,
      },
    },
  ];

  for (const service of demoServices) {
    const serviceRef = doc(seedDb, "services", service.id);
    const serviceSnap = await getDoc(serviceRef);
    if (!serviceSnap.exists()) {
      await setDoc(serviceRef, service.data);
    }
  }

  // Seed demo service request
  const requestRef = doc(seedDb, "serviceRequests", "demo_request");
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) {
    const demoRequest: Omit<ServiceRequest, "id"> = {
      serviceId: "math_tutoring",
      studentId: createdUsers.student || "student",
      providerId: createdUsers.teacher || "teacher",
      status: "APPROVED",
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    };
    await setDoc(requestRef, demoRequest);
  }

  // Seed demo escrow transactions (deterministic ids)
  const demoEscrow: Array<{ id: string; data: Omit<EscrowTransaction, "id"> }> = [
    {
      id: "demo_escrow_released",
      data: {
        payerId: createdUsers.parent || "parent",
        providerId: createdUsers.teacher || "teacher",
        amount: 2500,
        commission: 125,
        status: "RELEASED",
        serviceName: "Math Tutoring - Grade 5",
        createdAt: Date.now() - 172800000,
        releasedAt: Date.now() - 86400000,
      },
    },
    {
      id: "demo_escrow_held",
      data: {
        payerId: createdUsers.parent || "parent",
        providerId: createdUsers.transporter || "transporter",
        amount: 3500,
        commission: 175,
        status: "HELD",
        serviceName: "School Bus Route #15",
        createdAt: Date.now() - 43200000,
      },
    },
  ];
  for (const tx of demoEscrow) {
    const txRef = doc(seedDb, "escrow", tx.id);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) {
      await setDoc(txRef, tx.data);
    }
  }
}
