"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type SetRow = {
  id: number;
  question_ids: number[];
  answered: number;
  correct: number;
  created_at: string;
};

export default function SetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sets, setSets] = useState<SetRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setLoggedIn(false); setLoading(false); return; }
      setLoggedIn(true);
      const { data } = await supabase
        .from("question_sets")
        .select("id, question_ids, answered, correct, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setSets((data || []) as SetRow[]);
      setLoading(false);
    }
    load();
  }, []);

  function redo(s: SetRow) {
    const params = new URLSearchParams();
    params.set("ids", s.question_ids.join("~~"));
    router.push("/question?" + params.toString());
  }

  async function deleteSet(id: number) {
    if (!confirm("Delete this set?")) return;
    await supabase.from("question_sets").delete().eq("id", id);
    setSets((s) => s.filter((x) => x.id !== id));
  }

  if (loading)
    return <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6"><p className="text-zinc-400">Loading your sets…</p></main>;

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to see your saved sets.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Log In</Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Your question sets</h1>
      <p className="mt-2 text-zinc-600">Every session you complete is saved here. Redo any set to practise it again (reshuffled).</p>

      {sets.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-12 text-center shadow-sm">
          <p className="text-5xl">📚</p>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">No sets yet</h2>
          <p className="mt-2 text-zinc-500">Finish a study session and it&apos;ll be saved here to redo later.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {sets.map((s) => {
            const pct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
            const when = new Date(s.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div>
                  <p className="font-bold text-zinc-900">{s.question_ids.length} questions</p>
                  <p className="text-sm text-zinc-500">{when} · scored {s.correct}/{s.answered} ({pct}%)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => redo(s)} className="rounded-full bg-emerald-700 px-6 py-2.5 font-bold text-white transition-colors hover:bg-emerald-800">
                    🔁 Redo
                  </button>
                  <button onClick={() => deleteSet(s.id)} className="rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 transition-colors hover:border-red-300 hover:text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}