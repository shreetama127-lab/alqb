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
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("there");
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [savingDate, setSavingDate] = useState(false);

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
      setUserId(userData.user.id);
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

      const { data: exam } = await supabase
        .from("exam_dates")
        .select("exam_date")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (exam?.exam_date) setExamDate(exam.exam_date);

      setLoading(false);
    }
    loadStats();
  }, []);

  async function saveExamDate() {
    if (!dateInput || !userId) return;
    setSavingDate(true);
    const { error } = await supabase
      .from("exam_dates")
      .upsert({ user_id: userId, exam_date: dateInput, updated_at: new Date().toISOString() });
    if (error) console.error("Error saving exam date:", error);
    else setExamDate(dateInput);
    setSavingDate(false);
  }

  async function clearExamDate() {
    if (!userId) return;
    const { error } = await supabase.from("exam_dates").delete().eq("user_id", userId);
    if (error) console.error("Error clearing exam date:", error);
    else {
      setExamDate(null);
      setDateInput("");
    }
  }

  function daysUntil(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr + "T00:00:00");
    const diff = Math.round((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

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
    );const days = examDate ? daysUntil(examDate) : null;
  const prettyDate = examDate
    ? new Date(examDate + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

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

      <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
        {examDate && days !== null ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">📆</span>
              <div>
                {days > 0 ? (
                  <p className="text-2xl font-extrabold text-zinc-900">
                    <span className="text-emerald-700">{days}</span> day{days === 1 ? "" : "s"} until your exam
                  </p>
                ) : days === 0 ? (
                  <p className="text-2xl font-extrabold text-emerald-700">Your exam is today — good luck! 🍀</p>
                ) : (
                  <p className="text-2xl font-extrabold text-zinc-900">Exam date has passed</p>
                )}
                <p className="mt-1 text-sm font-semibold text-zinc-500">{prettyDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-emerald-400"
              />
              <button onClick={saveExamDate} disabled={!dateInput || savingDate} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:bg-zinc-300">
                Update
              </button>
              <button onClick={clearExamDate} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-50">
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">📆</span>
              <div>
                <p className="text-lg font-bold text-zinc-900">Set your exam date</p>
                <p className="mt-1 text-sm text-zinc-500">See a countdown to keep you on track.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-emerald-400"
              />
              <button onClick={saveExamDate} disabled={!dateInput || savingDate} className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:bg-zinc-300">
                {savingDate ? "Saving…" : "Set date"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}