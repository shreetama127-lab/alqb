"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Option = { letter: string; text: string; correct: boolean; explanation: string };
type Question = {
  id: number;
  stem: string;
  topic?: string;
  key_takeaway?: string | null;
  options: Option[];
};

const TAKEAWAY_HEADINGS = ["key takeaway", "highlights", "common mistake", "common mistakes", "exam tip", "exam tips"];

function paragraphs(text: string) {
  return (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function TakeawayText({ text }: { text: string }) {
  const lines = (text || "").split("\n").map((l) => l.trim());
  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {lines.map((line, i) => {
        if (!line) return null;
        const isHeading = TAKEAWAY_HEADINGS.includes(line.toLowerCase().replace(/[:.]$/, ""));
        return isHeading ? (
          <p key={i} className="mt-2 text-xs font-bold uppercase tracking-wide text-indigo-700">{line}</p>
        ) : (
          <p key={i} className="text-sm leading-relaxed text-zinc-700">{line}</p>
        );
      })}
    </div>
  );
}

export default function ReviewPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const idsParam = params.get("ids");
      if (!idsParam) { setLoading(false); return; }
      const ids = idsParam.split("~~").map((x) => parseInt(x, 10)).filter((x) => !isNaN(x));

      const { data } = await supabase
        .from("questions")
        .select("id, stem, topic, key_takeaway, options")
        .in("id", ids);

      // keep them in the saved order
      const byId: Record<number, Question> = {};
      (data || []).forEach((q) => { byId[q.id] = q as Question; });
      const ordered = ids.map((id) => byId[id]).filter(Boolean);
      setQuestions(ordered);
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6"><p className="text-zinc-400">Loading…</p></main>;

  if (questions.length === 0)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-zinc-400">Nothing to review.</p>
        <Link href="/sets" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">← Back to sets</Link>
      </main>
    );

  const q = questions[index];
  const showTakeaway = q.key_takeaway && q.key_takeaway.trim().length > 0;
  const progress = Math.round(((index + 1) / questions.length) * 100);

  function prev() { if (index > 0) setIndex(index - 1); }
  function next() { if (index + 1 < questions.length) setIndex(index + 1); }return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Review mode · {index + 1} of {questions.length}</p>
        <Link href="/sets" className="text-sm font-semibold text-zinc-500 hover:text-emerald-700">← Back to sets</Link>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-8 rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm">
        {q.topic && (
          <span className="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">{q.topic}</span>
        )}
        <h2 className="text-2xl font-bold leading-snug text-zinc-900">{q.stem}</h2>

        <div className="mt-6 flex flex-col gap-3">
          {q.options.map((option) => (
            <div key={option.letter} className={`rounded-2xl border-2 px-5 py-4 text-lg ${option.correct ? "border-emerald-500 bg-emerald-50" : "border-zinc-200"}`}>
              <div className="text-zinc-900">
                <span className="font-bold text-emerald-700">{option.letter}.</span> {option.text}
                {option.correct && <span className="ml-2 text-sm font-bold text-emerald-700">✓ Correct</span>}
              </div>
              {option.correct && option.explanation && (
                <div className="mt-2 flex flex-col gap-2 text-sm text-zinc-700">
                  {paragraphs(option.explanation).map((p, i) => (<p key={i}>{p}</p>))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showTakeaway && (
          <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
            <p className="font-bold text-indigo-800">✨ Highlights</p>
            <TakeawayText text={q.key_takeaway || ""} />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={prev} disabled={index === 0} className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-600 transition-all hover:-translate-y-0.5 hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40">
          ← Previous
        </button>
        {index + 1 < questions.length ? (
          <button onClick={next} className="rounded-full bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700">
            Next →
          </button>
        ) : (
          <Link href="/sets" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
            Done ✓
          </Link>
        )}
      </div>
    </main>
  );
}