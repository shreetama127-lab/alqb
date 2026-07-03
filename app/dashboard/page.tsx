"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type TopicStat = { topic: string; answered: number; correct: number };

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
  const [stats, setStats] = useState({ answered: 0, correct: 0 });
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  // The question banks. To launch a new bank later, set live: true
  // and point href at the right place — that's all it takes.
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
        .select("is_correct, question_id, created_at")
        .eq("user_id", userData.user.id);

      if (ans && ans.length > 0) {
        setStats({ answered: ans.length, correct: ans.filter((a) => a.is_correct).length });

        // ---- streak: count consecutive days up to today ----
        const days = new Set(
          ans.map((a) => new Date(a.created_at).toISOString().slice(0, 10))
        );
        let count2 = 0;
        const cursor = new Date();
        // allow streak to "hold" if they haven't answered yet today but did yesterday
        if (!days.has(cursor.toISOString().slice(0, 10))) {
          cursor.setDate(cursor.getDate() - 1);
        }
        while (days.has(cursor.toISOString().slice(0, 10))) {
          count2 += 1;
          cursor.setDate(cursor.getDate() - 1);
        }
        setStreak(count2);

        // ---- per-topic ----
        const { data: questions } = await supabase.from("questions").select("id, topic");
        const topicOf: Record<number, string> = {};
        (questions || []).forEach((qq) => {
          topicOf[qq.id] = qq.topic || "Other";
        });
        const map: Record<string, { answered: number; correct: number }> = {};
        ans.forEach((a) => {
          const t = topicOf[a.question_id] || "Other";
          if (!map[t]) map[t] = { answered: 0, correct: 0 };
          map[t].answered += 1;
          if (a.is_correct) map[t].correct += 1;
        });
        setTopics(
          Object.entries(map)
            .map(([topic, v]) => ({ topic, ...v }))
            .sort((a, b) => a.correct / a.answered - b.correct / b.answered)
        );
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  const R = 56;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - accuracy / 100);

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

      {stats.answered === 0 ? (
        <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-12 text-center shadow-sm">
          <p className="text-5xl">🌱</p>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">No questions answered yet</h2>
          <p className="mt-2 text-zinc-500">Answer a few questions and your stats will grow here.</p>
        </div>
      ) : (
        <>
          <h2 className="mt-12 text-2xl font-extrabold tracking-tight text-zinc-900">Your progress</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
              <div className="relative h-36 w-36">
                <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={R} fill="none" stroke="#d1fae5" strokeWidth="14" />
                  <circle cx="70" cy="70" r={R} fill="none" stroke="#059669" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-emerald-700">{accuracy}%</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Accuracy</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
              <p className="text-5xl font-extrabold text-zinc-900">{stats.answered}</p>
              <p className="mt-1 font-semibold text-zinc-500">Questions answered</p>
            </div>
            <div className="flex flex-col justify-center rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
              <p className="text-5xl font-extrabold text-emerald-700">{stats.correct}</p>
              <p className="mt-1 font-semibold text-zinc-500">Correct answers</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Performance by topic</h2>
            <p className="mt-1 text-sm text-zinc-500">Your weakest areas are listed first.</p>
            <div className="mt-6 flex flex-col gap-5">
              {topics.map((t) => {
                const pct = Math.round((t.correct / t.answered) * 100);
                const colour = pct >= 70 ? "#059669" : pct >= 40 ? "#d97706" : "#dc2626";
                return (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-zinc-700">{t.topic}</span>
                      <span className="font-bold" style={{ color: colour }}>
                        {pct}% <span className="font-normal text-zinc-400">({t.correct}/{t.answered})</span>
                      </span>
                    </div>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colour, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}