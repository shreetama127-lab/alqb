"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

const ALLOWED_EMAILS = [
  "shreetama127@gmail.com",
  "a.jahin002@gmail.com",
  "zchasmu@ucl.ac.uk",
  "anitalese@ymail.com",
];

type Signup = { id: number; name: string; email: string; message: string | null; created_at: string };
type Feedback = {
  id: number;
  question_id: number;
  reason: string | null;
  created_at: string;
  question_ref: string | null;
  exam_board: string | null;
  stem: string | null;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function qLabel(f: Feedback) {
  const board = f.exam_board || "";
  const ref = f.question_ref || `#${f.question_id}`;
  return `${board} ${ref}`.trim();
}

export default function TeamPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<"signups" | "reports" | "flags">("signups");

  const [signups, setSignups] = useState<Signup[]>([]);
  const [reports, setReports] = useState<Feedback[]>([]);
  const [flags, setFlags] = useState<Feedback[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email?.toLowerCase() || "";
      if (!email || !ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
        setAllowed(false);
        setChecking(false);
        return;
      }
      setAllowed(true);

      const { data: signupData } = await supabase
        .from("tutorial_signups")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false });
      setSignups((signupData || []) as Signup[]);

      // Reports joined to question details
      const { data: reportData } = await supabase
        .from("question_reports")
        .select("id, question_id, reason, created_at, questions(question_ref, exam_board, stem)")
        .order("created_at", { ascending: false });
      setReports(flattenFeedback(reportData));

      const { data: flagData } = await supabase
        .from("flags")
        .select("id, question_id, reason, created_at, questions(question_ref, exam_board, stem)")
        .order("created_at", { ascending: false });
      setFlags(flattenFeedback(flagData));

      setChecking(false);
    }
    load();
  }, []);

  function flattenFeedback(rows: unknown): Feedback[] {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      const qraw = row.questions;
      const q = Array.isArray(qraw) ? qraw[0] : qraw;
      const qq = (q || {}) as Record<string, unknown>;
      return {
        id: row.id as number,
        question_id: row.question_id as number,
        reason: (row.reason as string) ?? null,
        created_at: row.created_at as string,
        question_ref: (qq.question_ref as string) ?? null,
        exam_board: (qq.exam_board as string) ?? null,
        stem: (qq.stem as string) ?? null,
      };
    });
  }

  if (checking)
    return <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6"><p className="text-zinc-400">Loading…</p></main>;

  if (!allowed)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-5xl">🔒</p>
        <p className="text-lg font-semibold text-zinc-700">This page is for the ALQB team only.</p>
        <Link href="/dashboard" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">← Back to dashboard</Link>
      </main>
    );

  const tabs = [
    { key: "signups" as const, label: "Tutorial signups", count: signups.length, emoji: "🎓" },
    { key: "reports" as const, label: "Reported questions", count: reports.length, emoji: "⚠️" },
    { key: "flags" as const, label: "Flagged questions", count: flags.length, emoji: "⚑" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">Team dashboard</h1>
      <p className="mt-2 text-zinc-600">Tutorial signups and question feedback in one place.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${tab === t.key ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
          >
            {t.emoji} {t.label} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${tab === t.key ? "bg-white/20" : "bg-zinc-100"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tutorial signups */}
      {tab === "signups" && (
        <div className="mt-6 flex flex-col gap-4">
          {signups.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-white p-8 text-center text-zinc-400">No signups yet.</p>
          ) : (
            signups.map((s) => (
              <div key={s.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg font-extrabold text-zinc-900">{s.name}</p>
                  <p className="text-xs font-semibold text-zinc-400">{fmtDate(s.created_at)}</p>
                </div>
                <a href={`mailto:${s.email}`} className="text-sm font-semibold text-emerald-700 hover:underline">{s.email}</a>
                {s.message && <p className="mt-3 rounded-xl bg-emerald-50/60 px-4 py-3 text-sm text-zinc-700">{s.message}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Reported questions */}
      {tab === "reports" && (
        <div className="mt-6 flex flex-col gap-4">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-white p-8 text-center text-zinc-400">No reports yet.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">{qLabel(r)}</span>
                  <p className="text-xs font-semibold text-zinc-400">{fmtDate(r.created_at)}</p>
                </div>
                {r.stem && <p className="mt-3 text-sm font-semibold text-zinc-800">{r.stem}</p>}
                {r.reason && <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-zinc-700"><span className="font-bold text-amber-700">Reason: </span>{r.reason}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Flagged questions */}
      {tab === "flags" && (
        <div className="mt-6 flex flex-col gap-4">
          {flags.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-white p-8 text-center text-zinc-400">No flagged questions yet.</p>
          ) : (
            flags.map((f) => (
              <div key={f.id} className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600">{qLabel(f)}</span>
                  <p className="text-xs font-semibold text-zinc-400">{fmtDate(f.created_at)}</p>
                </div>
                {f.stem && <p className="mt-3 text-sm font-semibold text-zinc-800">{f.stem}</p>}
                {f.reason && <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-zinc-700">{f.reason}</p>}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-10">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}