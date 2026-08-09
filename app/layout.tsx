import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import NavBar from "./NavBar";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ALQB — A-Level Question Bank",
  description: "Exam-board specific question banks for A-Level Biology & Chemistry.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.className} min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/60 text-zinc-900`}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}