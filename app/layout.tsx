import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Link from "next/link";
import AuthButton from "./AuthButton";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ALQB — A-Level Question Bank",
  description: "Exam-board specific question banks for A-Level Biology & Chemistry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.className} bg-emerald-50/30 text-zinc-800`}>
        <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-white/80 px-6 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2">
            <img src="/ALQB%20logo.png" alt="ALQB" className="h-8 w-auto" />
            <span className="text-xl font-extrabold text-emerald-700">ALQB</span>
          </Link>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Link
              href="/study"
              className="rounded-full px-4 py-2 text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              Study
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full px-4 py-2 text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              Progress
            </Link>
            <AuthButton />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}