import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DemoDataInitializer } from "@/components/demo/DemoDataInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OmniStud - Bridging the Education Ecosystem",
  description: "All-in-one education platform connecting students, parents, teachers, and transporters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <DemoDataInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
