import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Folio — Your personal library",
  description:
    "Track the books you read, wrap them in official cover art, and arrange them on a beautiful 3D shelf.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-ink-950 text-cream-100 antialiased">
        <ToastProvider>{children}</ToastProvider>
        <div className="grain pointer-events-none fixed inset-0 z-[60]" aria-hidden />
      </body>
    </html>
  );
}
