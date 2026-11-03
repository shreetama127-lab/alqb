import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import NavBar from "./NavBar";
import { Analytics } from "@vercel/analytics/next";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alqb.co.uk"),
  title: {
    default: "ALQB — A-Level Biology & Chemistry Question Bank (OCR, AQA, IB)",
    template: "%s | ALQB",
  },
  description:
    "Practice exam-board specific A-Level Biology and Chemistry questions with instant explanations, timed challenges, flashcards and progress tracking. OCR and AQA question banks, with IB Biology coming soon.",
  keywords: ["A-Level Biology", "A-Level Chemistry", "OCR Biology", "AQA Biology", "IB Biology", "Biology revision", "A-Level Biology questions", "exam practice", "question bank"],
  openGraph: {
    title: "ALQB — A-Level Biology & Chemistry Question Bank",
    description: "Exam-board specific A-Level Biology & Chemistry practice questions with explanations, flashcards and progress tracking.",
    url: "https://www.alqb.co.uk",
    siteName: "ALQB",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.className} min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/60 text-zinc-900`}>
        <NavBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}