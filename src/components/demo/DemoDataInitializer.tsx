"use client";

import { useEffect, useRef } from "react";
import { seedDemoData } from "@/lib/demo-data";

export function DemoDataInitializer() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Seed demo data on app load with retry logic
    const trySeed = async (attempts = 0) => {
      try {
        await seedDemoData();
      } catch (err: unknown) {
        // Stop retrying on permission errors; rules must be updated in Firebase console
        const error = err as { code?: string; message?: string };
        if (error?.code === "permission-denied") {
          console.warn(
            "Demo data seeding blocked by Firestore security rules. " +
              "Ensure firestore.rules are deployed to your Firebase project."
          );
          return;
        }
        console.warn(`Demo data seed attempt ${attempts + 1} failed:`, error.message);
        if (attempts < 3) {
          setTimeout(() => trySeed(attempts + 1), 2000);
        }
      }
    };

    // Delay initial seed to allow Firebase to connect
    const timer = setTimeout(() => trySeed(), 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
