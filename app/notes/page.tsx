"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type NoteRow = {
  question_id: number;
  content: string;
  updated_at: string;
  stem: string;
  topic: string | null;
};

export default function NotesPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);

      const { data: noteRows } = await supabase
        .from("notes")
        .select("question_id, content, updated_at")
        .eq("user_id", userData.user.id)
        .order("updated_at", { ascending: false });

      const withText = (noteRows || []).filter((n) => (n.content || "").trim().length > 0);

      if (withText.length > 0) {
        const ids = withText.map((n) => n.question_id);
        const { data: qs } = await supabase
          .from("questions")
          .select("id, stem, topic")
          .in("id", ids);
        const qMap: Record<number, { stem: string; topic: string | null }> = {};
        (qs || []).forEach((q) => {
          qMap[q.id] = { stem: q.stem, topic: q.topic };
        });
        setNotes(
          withText.map((n) => ({
            question_id: n.question_id,
            content: n.content,
            updated_at: n.updated_at,
            stem: qMap[n.question_id]?.stem || "Question",
            topic: qMap[n.question_id]?.topic || null,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading your notes…</p>
      </main>
    );

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to see your notes.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
          Log In
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">My notes</h1>
      <p className="mt-2 text-zinc-500">Every note you&apos;ve written, newest first. Click one to expand it.</p>

      {notes.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-12 text-center shadow-sm">
          <p className="text-5xl">📝</p>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">No notes yet</h2>
          <p className="mt-2 text-zinc-500">Write notes on questions during a study session and they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {notes.map((n) => {
            const isOpen = openId === n.question_id;
            return (
              <div key={n.question_id} className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <button
                  onClick={() => setOpenId(isOpen ? null : n.question_id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="min-w-0">
                    {n.topic && (
                      <span className="mb-1 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        {n.topic}
                      </span>
                    )}
                    <span className="block truncate font-semibold text-zinc-800">{n.stem}</span>
                  </span>
                  <span className="shrink-0 text-emerald-600">{isOpen ? "▴" : "▾"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-100 px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm text-zinc-600">{n.content}</p>
                    <p className="mt-3 text-xs text-zinc-400">
                      Last edited {new Date(n.updated_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}