"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

// Add any email that should be allowed to view this page
const OWNER_EMAILS = ["shreetama127@gmail.com"];

type FlaggedQuestion = {
  id: number;
  stem: string;
  topic: string;
  count: number;
  last: string;
};

export default function FlaggedPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [items, setItems] = useState<FlaggedQuestion[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);

      const email = userData.user.email || "";
      if (!OWNER_EMAILS.includes(email)) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setAllowed(true);

      const { data: flags } = await supabase
        .from("flags")
        .select("question_id, created_at");
      const { data: questions } = await supabase
        .from("questions")
        .select("id, stem, topic");

      const qMap: Record<number, { stem: string; topic: string }> = {};
      (questions || []).forEach((q) => {
        qMap[q.id] = { stem: q.stem, topic: q.topic || "Other" };
      });

      const agg: Record<number, { count: number; last: string }> = {};
      (flags || []).forEach((f) => {
        if (!agg[f.question_id]) agg[f.question_id] = { count: 0, last: f.created_at };
        agg[f.question_id].count += 1;
        if (f.created_at > agg[f.question_id].last) agg[f.question_id].last = f.created_at;
      });

      const list: FlaggedQuestion[] = Object.entries(agg).map(([id, v]) => ({
        id: Number(id),
        stem: qMap[Number(id)]?.stem || "(question not found)",
        topic: qMap[Number(id)]?.topic || "Other",
        count: v.count,
        last: v.last,
      }));
      list.sort((a, b) => b.count - a.count);
      setItems(list);
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading flagged questions…</p>
      </main>
    );

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to view this page.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
          Log In
        </Link>
      </main>
    );

  if (!allowed)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 text-center">
        <p className="text-lg text-zinc-600">This page is for administrators only.</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Flagged questions</h1>
      <p className="mt-2 text-zinc-500">Questions students have flagged for review, most-flagged first.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-12 text-center shadow-sm">
          <p className="text-5xl">✅</p>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">No flagged questions</h2>
          <p className="mt-2 text-zinc-500">Nothing has been flagged yet — all clear.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {item.topic} · Question #{item.id}
                  </p>
                  <p className="mt-1 font-semibold text-zinc-800">{item.stem}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Last flagged {new Date(item.last).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                  {item.count} flag{item.count === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}