"use client";

import Link from "next/link";

type Tip = { emoji: string; title: string; body: string };

const TIPS: Tip[] = [
  {
    emoji: "🎯",
    title: "Study by topic, little and often",
    body: "Short, focused sessions on one or two topics beat long unfocused ones. Use the module and topic filters to zero in on what you're revising this week.",
  },
  {
    emoji: "🔁",
    title: "Revisit your weak topics",
    body: "Your study page shows a progress bar per topic. Come back to the ones with low completion or low accuracy — spaced repetition is how things stick.",
  },
  {
    emoji: "📖",
    title: "Use the Further resources links",
    body: "When you get a question wrong, open the linked Physics & Maths Tutor notes or a video to close the gap before moving on.",
  },
  {
    emoji: "⏱️",
    title: "Practise under timed conditions",
    body: "Closer to exams, set a timer to build pace and exam stamina. You can pause any time if you need a break.",
  },
  {
    emoji: "🚩",
    title: "Flag anything confusing",
    body: "Not sure about a question? Flag it, keep going, and come back later — flagged questions are marked in your session sidebar.",
  },
];

export default function TipsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Study tips</h1>
      <p className="mt-2 text-zinc-500">How to get the most out of ALQB for your revision.</p>

      <div className="mt-8 flex flex-col gap-4">
        {TIPS.map((tip, i) => (
          <div key={i} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{tip.emoji}</span>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{tip.title}</h2>
                <p className="mt-1 text-zinc-600">{tip.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
        <p className="text-3xl">✍️</p>
        <h2 className="mt-3 text-lg font-bold text-zinc-900">More guides coming soon</h2>
        <p className="mt-1 text-sm text-zinc-500">We&apos;ll add detailed revision guides and exam techniques here.</p>
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/dashboard" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}