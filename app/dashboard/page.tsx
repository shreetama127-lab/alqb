"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Bank = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  href: string;
  live: boolean;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState("there");
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  const banks: Bank[] = [
    {
      id: "ocr-biology",
      title: "OCR A-Level Biology",
      subtitle: questionCount ? `${questionCount} questions` : "Question bank",
      emoji: "🧬",
      href: "/study",
      live: true,
    },
    {
      id: "aqa-biology",
      title: "AQA A-Level Biology",
      subtitle: "Coming soon",
      emoji: "🌿",
      href: "#",
      live: false,
    },
    {
      id: "chemistry",
      title: "A-Level Chemistry",
      subtitle: "Coming soon",
      emoji: "🧪",
      href: "#",
      live: false,
    },
    {
      id: "ib-biology",
      title: "IB Biology",
      subtitle: "Coming soon",
      emoji: "🌍",
      href: "#",
      live: false,
    },
  ];

  useEffect(() => {
    async function loadStats() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);
      setFirstName(userData.user.user_metadata?.first_name || "there");

      const { count } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true });
      if (count) setQuestionCount(count);

      const { data: ans } = await supabase
        .from("answers")
        .select("created_at")
        .eq("user_id", userData.user.id);

      if (ans && ans.length > 0) {
        const days = new Set(
          ans.map((a) => new Date(a.created_at).toISOString().slice(0, 10))
        );
        let count2 = 0;
        const cursor = new Date();
        if (!days.has(cursor.toISOString().slice(0, 10))) {
          cursor.setDate(cursor.getDate() - 1);
        }
        while (days.has(cursor.toISOString().slice(0, 10))) {
          count2 += 1;
          cursor.setDate(cursor.getDate() - 1);
        }
        setStreak(count2);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading your dashboard…</p>
      </main>
    );

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to see your dashboard.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
          Log In
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Welcome back, <span className="text-emerald-700">{firstName}</span>
          </h1>
          <p className="mt-2 text-lg text-zinc-500">What would you like to study today?</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-extrabold text-orange-600">{streak}</p>
              <p className="text-xs font-semibold text-orange-600/70">
                day{streak === 1 ? "" : "s"} in a row
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {banks.map((bank) =>
          bank.live ? (
            <Link
              key={bank.id}
              href={bank.href}
              className="group rounded-3xl border-2 border-emerald-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"
            >
              <p className="text-4xl">{bank.emoji}</p>
              <h3 className="mt-4 text-xl font-extrabold text-zinc-900 group-hover:text-emerald-700">
                {bank.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-zinc-500">{bank.subtitle}</p>
              <p className="mt-4 text-sm font-bold text-emerald-700">Start studying →</p>
            </Link>
          ) : (
            <div
              key={bank.id}
              className="relative rounded-3xl border-2 border-zinc-100 bg-zinc-50 p-7 opacity-70"
            >
              <span className="absolute right-5 top-5 rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Coming soon
              </span>
              <p className="text-4xl grayscale">{bank.emoji}</p>
              <h3 className="mt-4 text-xl font-extrabold text-zinc-400">{bank.title}</h3>
              <p className="mt-1 text-sm font-semibold text-zinc-400">{bank.subtitle}</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}