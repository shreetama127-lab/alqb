"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { PLANS, FREE_PLAN_IDS } from "@/app/lib/plans";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("there");
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [noteCount, setNoteCount] = useState(0);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);

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

      const { count: nCount } = await supabase
        .from("notes")
        .select("question_id", { count: "exact", head: true })
        .eq("user_id", userData.user.id);
      if (nCount) setNoteCount(nCount);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_id, status")
        .eq("user_id", userData.user.id)
        .eq("status", "active");
      const owned = (subs || []).map((s) => s.plan_id);
      setActiveIds([...new Set([...owned, ...FREE_PLAN_IDS])]);

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
      if (exam?.exam_date) {
        setExamDate(exam.exam_date);
        setDateInput(exam.exam_date);
      }

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
    else {
      setExamDate(dateInput);
      setShowExamModal(false);
    }
    setSavingDate(false);
  }

  async function clearExamDate() {
    if (!userId) return;
    const { error } = await supabase.from("exam_dates").delete().eq("user_id", userId);
    if (error) console.error("Error clearing exam date:", error);
    else {
      setExamDate(null);
      setDateInput("");
      setShowExamModal(false);
    }
  }

  function daysUntil(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr + "T00:00:00");
    return Math.round((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";
  const myPlans = PLANS.filter((p) => activeIds.includes(p.id));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-zinc-900">Exam date</h2>
              <button onClick={() => setShowExamModal(false)} className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:text-zinc-600">×</button>
            </div>
            {examDate && <p className="mt-2 text-sm font-semibold text-zinc-500">Currently set to {prettyDate}</p>}
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="mt-5 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-700 outline-none focus:border-emerald-400"
            />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {examDate && (
                <button onClick={clearExamDate} className="rounded-full border-2 border-zinc-200 bg-white px-6 py-2.5 font-bold text-zinc-600 transition-all hover:border-red-300 hover:text-red-500">
                  Clear
                </button>
              )}
              <button onClick={saveExamDate} disabled={!dateInput || savingDate} className="rounded-full bg-emerald-700 px-8 py-2.5 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:bg-zinc-300 disabled:shadow-none">
                {savingDate ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Welcome back, <span className="text-emerald-700">{firstName}</span>
          </h1>
          <p className="mt-2 text-lg text-zinc-500">What would you like to study today?</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/notes" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 font-bold text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400">
            <span className="text-2xl">📝</span>
            <span className="text-sm">
              Review notes
              {noteCount > 0 && <span className="ml-1 font-semibold text-zinc-400">({noteCount})</span>}
            </span>
          </Link>

          <button onClick={() => setShowExamModal(true)} className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400">
            <span className="text-2xl">📆</span>
            {days !== null ? (
              <span>
                <span className="block text-lg font-extrabold leading-tight text-emerald-700">
                  {days > 0 ? `${days} day${days === 1 ? "" : "s"}` : days === 0 ? "Today!" : "Passed"}
                </span>
                <span className="block text-xs font-semibold text-zinc-400">until your exam</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-emerald-700">Set exam date</span>
            )}
          </button>

          {streak > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
              <span className="text-2xl">🔥</span>
              <span>
                <span className="block text-lg font-extrabold leading-tight text-orange-600">{streak}</span>
                <span className="block text-xs font-semibold text-orange-600/70">day{streak === 1 ? "" : "s"} in a row</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {myPlans.map((plan) => (
          <Link key={plan.id} href="/study" className="group rounded-3xl border-2 border-emerald-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg">
            <p className="text-4xl">{plan.emoji}</p>
            <h3 className="mt-4 text-xl font-extrabold text-zinc-900 group-hover:text-emerald-700">{plan.title}</h3>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {questionCount ? `${questionCount} questions` : "Question bank"}
            </p>
            <p className="mt-4 text-sm font-bold text-emerald-700">Start studying →</p>
          </Link>
        ))}

        <Link href="/subscriptions" className="group flex flex-col justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-7 text-center transition-all hover:-translate-y-1 hover:border-emerald-400">
          <p className="text-4xl">➕</p>
          <h3 className="mt-4 text-xl font-extrabold text-emerald-700">Add a question bank</h3>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Browse all subscriptions</p>
        </Link>
      </div>
    </main>
  );
}