import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { UserProfile, UserRole, AppSettings, Service, ServiceRequest, EscrowTransaction } from "@/types";

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
    color: "#3b4cca",
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

export async function seedDemoData() {
  // Seed app settings if not present
  const settingsRef = doc(db, "settings", "app_settings");
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
    const planRef = doc(db, "subscriptionPlans", plan.plan);
    const planSnap = await getDoc(planRef);
    if (!planSnap.exists()) {
      await setDoc(planRef, plan);
    }
  }

  const createdUsers: Record<string, string> = {};

  // Create demo users if they don't exist
  for (const [role, creds] of Object.entries(DEMO_CREDENTIALS)) {
    try {
      let uid: string;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, creds.email, creds.password);
        uid = userCredential.user.uid;
        await auth.signOut();
      } catch (err) {
        const newUser = await createUserWithEmailAndPassword(auth, creds.email, creds.password);
        uid = newUser.user.uid;
        await updateProfile(newUser.user, { displayName: creds.name });
      }

      createdUsers[role] = uid;

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      const baseProfile: Partial<UserProfile> = {
        uid,
        email: creds.email,
        displayName: creds.name,
        paymentStatus: "COMPLETED",
        subscriptionPlan: role === "parent" ? "PRO" : role === "student" ? "BASIC" : role === "admin" ? "ENTERPRISE" : "PRO",
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
    } catch (error) {
      console.error(`Error seeding ${role} demo user:`, error);
    }
  }

  // Link parent to student
  if (createdUsers.parent && createdUsers.student) {
    try {
      await updateDoc(doc(db, "users", createdUsers.parent), {
        children: [createdUsers.student],
        updatedAt: Date.now(),
      });
      await updateDoc(doc(db, "users", createdUsers.student), {
        parentId: createdUsers.parent,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error linking parent and student:", error);
    }
  }

  // Seed demo services
  const servicesRef = collection(db, "services");
  const servicesSnap = await getDoc(doc(servicesRef, "math_tutoring"));
  
  if (!servicesSnap.exists()) {
    const services: Omit<Service, "id">[] = [
      {
        providerId: createdUsers.teacher || "teacher",
        name: "Math Tutoring - Grade 5",
        description: "Comprehensive mathematics tutoring for Grade 5 students covering arithmetic, geometry, and problem solving.",
        price: 2500,
        providerType: "TEACHER",
        category: "Tutoring",
        location: "Guwahati",
        rating: 4.8,
        reviews: 24,
      },
      {
        providerId: createdUsers.teacher || "teacher",
        name: "Science Class - Grade 5",
        description: "Interactive science classes with practical experiments and conceptual learning.",
        price: 2000,
        providerType: "TEACHER",
        category: "Tutoring",
        location: "Guwahati",
        rating: 4.7,
        reviews: 18,
      },
      {
        providerId: createdUsers.transporter || "transporter",
        name: "School Bus Route #15",
        description: "Safe school transportation with GPS tracking, covering major areas of Guwahati.",
        price: 3500,
        providerType: "TRANSPORTER",
        category: "Transportation",
        location: "Guwahati",
        rating: 4.6,
        reviews: 32,
      },
      {
        providerId: createdUsers.transporter || "transporter",
        name: "Van Route #3 - City Prep",
        description: "Door-to-door van service for City Prep School students with live tracking.",
        price: 2800,
        providerType: "TRANSPORTER",
        category: "Transportation",
        location: "Guwahati",
        rating: 4.5,
        reviews: 15,
      },
    ];

    for (let i = 0; i < services.length; i++) {
      await addDoc(servicesRef, services[i]);
    }
  }

  // Seed demo service request
  const requestsRef = collection(db, "serviceRequests");
  const requestsSnap = await getDoc(doc(requestsRef, "demo_request"));
  if (!requestsSnap.exists()) {
    const demoRequest: Omit<ServiceRequest, "id"> = {
      serviceId: "math_tutoring",
      studentId: createdUsers.student || "student",
      providerId: createdUsers.teacher || "teacher",
      status: "APPROVED",
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    };
    await addDoc(requestsRef, demoRequest);
  }

  // Seed demo escrow transactions
  const escrowRef = collection(db, "escrow");
  const escrowSnap = await getDoc(doc(escrowRef, "demo_escrow"));
  if (!escrowSnap.exists()) {
    const transactions: Omit<EscrowTransaction, "id">[] = [
      {
        payerId: createdUsers.parent || "parent",
        providerId: createdUsers.teacher || "teacher",
        amount: 2500,
        commission: 125,
        status: "RELEASED",
        serviceName: "Math Tutoring - Grade 5",
        createdAt: Date.now() - 172800000,
        releasedAt: Date.now() - 86400000,
      },
      {
        payerId: createdUsers.parent || "parent",
        providerId: createdUsers.transporter || "transporter",
        amount: 3500,
        commission: 175,
        status: "HELD",
        serviceName: "School Bus Route #15",
        createdAt: Date.now() - 43200000,
      },
    ];
    for (const tx of transactions) {
      await addDoc(escrowRef, tx);
    }
  }
}
