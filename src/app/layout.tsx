import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

// Initialize Data Quality System
import '@/tools/data-quality/startup';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Geopolitical Risk Intelligence",
  description: "Advanced geopolitical risk analysis and portfolio management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}