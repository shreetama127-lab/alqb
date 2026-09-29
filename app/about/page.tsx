"use client";

import Link from "next/link";

function DoctorsCartoon() {
  return (
    <svg viewBox="0 0 360 200" className="mx-auto h-auto w-full max-w-md" role="img" aria-label="Three cartoon doctors">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="200" rx="24" fill="url(#bg)" />
      {[60, 180, 300].map((cx, i) => (
        <g key={i} transform={`translate(${cx},0)`}>
          <path d="M-34 190 C-34 150 -22 132 0 132 C22 132 34 150 34 190 Z" fill="#ffffff" stroke="#d1fae5" strokeWidth="3" />
          <path d="M-10 134 L0 150 L10 134 Z" fill="#10b981" />
          <path d="M-8 136 C-8 158 8 158 8 136" fill="none" stroke="#059669" strokeWidth="3" />
          <circle cx="8" cy="160" r="4" fill="#059669" />
          <rect x="-7" y="120" width="14" height="16" rx="6" fill="#f2d3b3" />
          <circle cx="0" cy="104" r="22" fill="#f2d3b3" />
          {/* long hair */}
          <path d="M-24 104 C-24 78 24 78 24 104 L24 128 C24 128 18 118 18 104 C18 118 12 122 0 122 C-12 122 -18 118 -18 104 C-18 118 -24 128 -24 128 Z" fill="#5b3a29" />
          <path d="M-22 100 C-22 84 22 84 22 100 C22 90 14 82 0 82 C-14 82 -22 90 -22 100 Z" fill="#5b3a29" />
          <circle cx="-8" cy="104" r="2.4" fill="#1f2937" />
          <circle cx="8" cy="104" r="2.4" fill="#1f2937" />
          <path d="M-8 114 C-3 120 3 120 8 114" fill="none" stroke="#1f2937" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">About us</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">The people behind ALQB.</p>
      </div>

      <div className="mt-10 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <DoctorsCartoon />
        <p className="px-6 pb-5 pt-1 text-center text-sm font-semibold text-zinc-400">A real team photo is on the way. For now, here we are in cartoon form 🩺</p>
      </div>

      <div className="mt-10 flex flex-col gap-5 text-lg leading-relaxed text-zinc-700">
        <p>
          We are three doctors and the cofounders of ALQB. We started it because we love teaching, and because we remember exactly how hard these exams can feel.
        </p>
        <p>
          Along the way, from A-Levels through medical school and into practice, we worked out what actually helps you remember things. Testing yourself over and over beats reading notes again. Coming back to a topic just as it starts to fade locks it in. Keeping an eye on your progress shows you where to put your energy. And talking through why an answer is right, rather than just learning that it is, is what makes it stick.
        </p>
        <p>
          ALQB brings all of that together in one place, built around the exams you are actually sitting.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-extrabold text-zinc-900">What ALQB gives you</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-2xl">📚</p>
            <h3 className="mt-2 font-bold text-zinc-900">Exam-board specific banks</h3>
            <p className="mt-1 text-sm text-zinc-600">Questions mapped to your exact specification, so every minute counts.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-2xl">💡</p>
            <h3 className="mt-2 font-bold text-zinc-900">Fully explained answers</h3>
            <p className="mt-1 text-sm text-zinc-600">Every option explained, so you know where you went wrong and why.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-2xl">🃏</p>
            <h3 className="mt-2 font-bold text-zinc-900">Flashcards</h3>
            <p className="mt-1 text-sm text-zinc-600">Turn any question into a flashcard and drill it with active recall.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-2xl">⏱️</p>
            <h3 className="mt-2 font-bold text-zinc-900">Timed practice</h3>
            <p className="mt-1 text-sm text-zinc-600">Build exam stamina with timed challenges and a countdown to your exam.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-2xl">📈</p>
            <h3 className="mt-2 font-bold text-zinc-900">Progress tracking</h3>
            <p className="mt-1 text-sm text-zinc-600">Watch your accuracy grow topic by topic and catch weak areas early.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-2xl">💬</p>
            <h3 className="mt-2 font-bold text-zinc-900">Discuss the answers</h3>
            <p className="mt-1 text-sm text-zinc-600">Talk questions through with other students, because explaining it is how you learn it.</p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
        <p className="text-lg font-bold text-zinc-800">Made by doctors, for the next generation of students.</p>
        <p className="mt-1 text-sm text-zinc-600">We are just getting started. New banks, tutorials and features are on the way.</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Get started</Link>
        <Link href="/contact" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">Contact us</Link>
      </div>
    </main>
  );
}