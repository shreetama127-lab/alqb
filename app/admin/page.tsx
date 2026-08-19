"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

const ADMIN_EMAILS = ["shreetama127@gmail.com"];

type Stat = {
  id: number;
  question_ref: string | null;
  exam_board: string | null;
  topic: string | null;
  module: string | null;
  thumbs_up: number;
  thumbs_down: number;
  reports: number;
  flags: number;
  answered: number;
  correct: number;
};

type SortKey = "reports" | "thumbs_down" | "flags" | "accuracy" | "answered";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("reports");
  const [openReports, setOpenReports] = useState<number | null>(null);
  const [reportText, setReportText] = useState<{ reason: string; created_at: string }[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !ADMIN_EMAILS.includes(userData.user.email || "")) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setAllowed(true);

      const { data, error } = await supabase.rpc("admin_question_stats");
      if (error) console.error("admin stats error:", error);
      setStats((data || []) as Stat[]);
      setLoading(false);
    }
    load();
  }, []);

  async function viewReports(qid: number) {
    if (openReports === qid) { setOpenReports(null); return; }
    const { data } = await supabase.rpc("admin_reports_for", { qid });
    setReportText((data || []) as { reason: string; created_at: string }[]);
    setOpenReports(qid);
  }

  function code(s: Stat) {
    const board = s.exam_board || "OCR";
    return s.question_ref ? `${board} ${s.question_ref}` : `${board} ${s.id}`;
  }

  function accuracyOf(s: Stat) {
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : null;
  }

  const sorted = [...stats].sort((a, b) => {
    if (sortBy === "accuracy") {
      const aa = accuracyOf(a); const ba = accuracyOf(b);
      if (aa === null) return 1;
      if (ba === null) return -1;
      return aa - ba; // worst accuracy first
    }
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  const totals = stats.reduce(
    (acc, s) => {
      acc.up += s.thumbs_up; acc.down += s.thumbs_down; acc.reports += s.reports; acc.flags += s.flags;
      return acc;
    },
    { up: 0, down: 0, reports: 0, flags: 0 }
  );if (loading)
    return <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6"><p className="text-zinc-400">Loading…</p></main>;

  if (!allowed)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-5xl">🔒</p>
        <p className="text-lg font-semibold text-zinc-700">This page is for ALQB admins only.</p>
        <Link href="/dashboard" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">← Back to dashboard</Link>
      </main>
    );

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "reports", label: "Most reported" },
    { key: "thumbs_down", label: "Most 👎" },
    { key: "flags", label: "Most flagged" },
    { key: "accuracy", label: "Lowest accuracy" },
    { key: "answered", label: "Most answered" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Admin · Question stats</h1>
      <p className="mt-2 text-zinc-500">Spot questions students are reporting, disliking or getting wrong.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm"><p className="text-2xl font-extrabold text-emerald-700">{totals.up}</p><p className="text-xs font-semibold text-zinc-500">Total 👍</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm"><p className="text-2xl font-extrabold text-red-500">{totals.down}</p><p className="text-xs font-semibold text-zinc-500">Total 👎</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm"><p className="text-2xl font-extrabold text-amber-600">{totals.reports}</p><p className="text-xs font-semibold text-zinc-500">Total reports</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm"><p className="text-2xl font-extrabold text-zinc-700">{totals.flags}</p><p className="text-xs font-semibold text-zinc-500">Total flags</p></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
        {sortButtons.map((b) => (
          <button key={b.key} onClick={() => setSortBy(b.key)} className={`rounded-full px-4 py-2 transition-colors ${sortBy === b.key ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>{b.label}</button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-bold uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3 text-center">👍</th>
              <th className="px-4 py-3 text-center">👎</th>
              <th className="px-4 py-3 text-center">Reports</th>
              <th className="px-4 py-3 text-center">Flags</th>
              <th className="px-4 py-3 text-center">Accuracy</th>
              <th className="px-4 py-3 text-center">Answered</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const acc = accuracyOf(s);
              return (
                <>
                  <tr key={s.id} className="border-b border-zinc-50 hover:bg-emerald-50/30">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-700">{code(s)}</td>
                    <td className="px-4 py-3 text-zinc-600">{s.topic || "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-700">{s.thumbs_up}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${s.thumbs_down > 0 ? "text-red-500" : "text-zinc-400"}`}>{s.thumbs_down}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${s.reports > 0 ? "text-amber-600" : "text-zinc-400"}`}>{s.reports}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${s.flags > 0 ? "text-zinc-700" : "text-zinc-400"}`}>{s.flags}</td>
                    <td className="px-4 py-3 text-center">
                      {acc === null ? <span className="text-zinc-300">—</span> : <span className={`font-bold ${acc >= 70 ? "text-emerald-700" : acc >= 40 ? "text-amber-600" : "text-red-500"}`}>{acc}%</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500">{s.answered}</td>
                    <td className="px-4 py-3 text-right">
                      {s.reports > 0 && (
                        <button onClick={() => viewReports(s.id)} className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50">
                          {openReports === s.id ? "Hide" : "View"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {openReports === s.id && (
                    <tr className="bg-amber-50/40">
                      <td colSpan={9} className="px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Reports for {code(s)}</p>
                        <div className="mt-2 flex flex-col gap-2">
                          {reportText.length === 0 ? (
                            <p className="text-sm text-zinc-500">No report text.</p>
                          ) : reportText.map((r, i) => (
                            <div key={i} className="rounded-xl border border-amber-100 bg-white p-3">
                              <p className="text-sm text-zinc-700">{r.reason}</p>
                              <p className="mt-1 text-xs text-zinc-400">{new Date(r.created_at).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}