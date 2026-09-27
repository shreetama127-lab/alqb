"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Option = { letter: string; text: string; correct: boolean; explanation: string };
type Flashcard = {
  id: number;
  question_id: number | null;
  front: string | null;
  back: string | null;
  created_at: string;
  q_stem?: string | null;
  q_options?: Option[] | null;
  q_takeaway?: string | null;
  q_ref?: string | null;
  q_board?: string | null;
};

function correctAnswerText(opts: Option[] | null | undefined) {
  if (!opts) return "";
  const c = opts.find((o) => o.correct);
  if (!c) return "";
  return `${c.letter}. ${c.text}`;
}

function correctExplanation(opts: Option[] | null | undefined) {
  if (!opts) return "";
  const c = opts.find((o) => o.correct);
  return c?.explanation || "";
}

export default function FlashcardsPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoggedIn(false); setLoading(false); return; }
    setLoggedIn(true);

    const { data: fc } = await supabase
      .from("flashcards")
      .select("id, question_id, front, back, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    const list = (fc || []) as Flashcard[];

    // fetch question details for cards linked to a question
    const qIds = list.map((c) => c.question_id).filter((x): x is number => !!x);
    if (qIds.length > 0) {
      const { data: qs } = await supabase
        .from("questions")
        .select("id, stem, options, key_takeaway, question_ref, exam_board")
        .in("id", qIds);
      const map: Record<number, { stem: string; options: Option[]; key_takeaway: string; question_ref: string; exam_board: string }> = {};
      (qs || []).forEach((q) => {
        map[q.id as number] = {
          stem: q.stem as string,
          options: (q.options as Option[]) || [],
          key_takeaway: (q.key_takeaway as string) || "",
          question_ref: (q.question_ref as string) || "",
          exam_board: (q.exam_board as string) || "",
        };
      });
      list.forEach((c) => {
        if (c.question_id && map[c.question_id]) {
          const q = map[c.question_id];
          c.q_stem = q.stem;
          c.q_options = q.options;
          c.q_takeaway = q.key_takeaway;
          c.q_ref = q.question_ref;
          c.q_board = q.exam_board;
        }
      });
    }

    setCards(list);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggleFlip(id: number) {
    setFlipped((f) => ({ ...f, [id]: !f[id] }));
  }

  async function createCard() {
    if (!newFront.trim() || !newBack.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setSaving(true);
    await supabase.from("flashcards").insert({
      user_id: userData.user.id,
      front: newFront.trim(),
      back: newBack.trim(),
    });
    setNewFront("");
    setNewBack("");
    setShowCreate(false);
    setSaving(false);
    load();
  }

  async function deleteCard(id: number) {
    await supabase.from("flashcards").delete().eq("id", id);
    setCards((c) => c.filter((x) => x.id !== id));
  }

  if (loading)
    return <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6"><p className="text-zinc-400">Loading flashcards…</p></main>;

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to see your flashcards.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Log In</Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-10">
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-zinc-900">New flashcard</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:text-zinc-600">×</button>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <div>
                <label className="text-sm font-bold text-zinc-600">Front (question / prompt)</label>
                <textarea value={newFront} onChange={(e) => setNewFront(e.target.value)} className="mt-1 h-24 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-600">Back (answer)</label>
                <textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} className="mt-1 h-24 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-emerald-400" />
              </div>
              <button onClick={createCard} disabled={saving || !newFront.trim() || !newBack.trim()} className="mt-2 rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:bg-zinc-300 disabled:shadow-none">{saving ? "Saving…" : "Create card"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">Flashcards</h1>
          <p className="mt-2 text-zinc-600">Tap a card to flip it. {cards.length} card{cards.length === 1 ? "" : "s"}.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-full bg-emerald-700 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">➕ New card</button>
      </div>

      {cards.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center">
          <p className="text-4xl">🃏</p>
          <p className="mt-3 font-bold text-zinc-700">No flashcards yet</p>
          <p className="mt-1 text-sm text-zinc-500">Add questions to flashcards while studying, or create your own with the button above.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {cards.map((card) => {
            const isFlipped = !!flipped[card.id];
            const front = card.question_id ? (card.q_stem || "Question") : (card.front || "");
            const answerText = card.question_id ? correctAnswerText(card.q_options) : "";
            const explanation = card.question_id ? correctExplanation(card.q_options) : "";
            const back = card.question_id ? "" : (card.back || "");
            const label = card.question_id ? `${card.q_board || ""} ${card.q_ref || ""}`.trim() : "Custom card";
            return (
              <div key={card.id} className="relative">
                <button
                  onClick={() => toggleFlip(card.id)}
                  className={`min-h-[220px] w-full rounded-3xl border-2 p-6 text-left shadow-sm transition-all hover:shadow-md ${isFlipped ? "border-emerald-400 bg-emerald-50/50" : "border-emerald-100 bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">{label || "Card"}</span>
                    <span className="text-xs font-semibold text-zinc-400">{isFlipped ? "Answer" : "Question"}</span>
                  </div>
                  {!isFlipped ? (
                    <p className="mt-4 text-lg font-semibold text-zinc-900">{front}</p>
                  ) : (
                    <div className="mt-4"></div>