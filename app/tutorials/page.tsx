"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function TutorialsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
    setBusy(true);
    const { error: err } = await supabase.from("tutorial_signups").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim() || null,
    });
    setBusy(false);
    if (err) { setError("Something went wrong — please try again."); return; }
    setSent(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-center">
        <p className="text-5xl">🎓</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900">ALQB Tutorials</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
          Weekly Biology and Chemistry tutorials throughout the year to help you ace your exams — taught by experienced tutors who&apos;ve been through the process themselves.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl">📅</p>
          <h3 className="mt-3 font-bold text-zinc-900">Weekly</h3>
          <p className="mt-1 text-sm text-zinc-500">One session every week through the year</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl">⏱️</p>
          <h3 className="mt-3 font-bold text-zinc-900">40 minutes</h3>
          <p className="mt-1 text-sm text-zinc-500">Focused, exam-focused sessions</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl">🚀</p>
          <h3 className="mt-3 font-bold text-zinc-900">From September</h3>
          <p className="mt-1 text-sm text-zinc-500">Schedule posted soon</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        {sent ? (
          <div className="text-center">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-3 text-2xl font-extrabold text-zinc-900">You&apos;re signed up!</h2>
            <p className="mt-2 text-zinc-600">Thanks for registering your interest. We&apos;ll email you the schedule and joining details before sessions start in September.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-zinc-900">Register your interest</h2>
            <p className="mt-1 text-sm text-zinc-500">Pop your details in and we&apos;ll send you the schedule and how to join.</p>
            <div className="mt-5 flex flex-col gap-3">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
              <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
              <textarea placeholder="Anything you'd like us to know? (optional)" value={message} onChange={(e) => setMessage(e.target.value)} className="h-24 resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-emerald-400" />
              <button onClick={signUp} disabled={busy} className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:bg-zinc-300">
                {busy ? "Signing up…" : "Sign me up"}
              </button>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">{error}</p>}
          </>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 text-center">
        <p className="text-sm text-zinc-600">
          Questions about tutorials? Email us at{" "}
          <a href="mailto:info.alqb@gmail.com" className="font-bold text-emerald-700 hover:underline">info.alqb@gmail.com</a>
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to home</Link>
      </div>
    </main>
  );
}