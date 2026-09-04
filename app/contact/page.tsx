"use client";

import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Contact us</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Questions, feedback, or need a hand? We&apos;d love to hear from you.
      </p>
      <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-zinc-400">Email</p>
        <a href="mailto:info.alqb@gmail.com" className="mt-1 block text-xl font-extrabold text-emerald-700 hover:underline">
          info.alqb@gmail.com
        </a>
        <p className="mt-4 text-sm text-zinc-500">We aim to reply within a couple of working days.</p>
      </div>
      <div className="mt-8">
        <Link href="/" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          ← Back home
        </Link>
      </div>
    </main>
  );
}