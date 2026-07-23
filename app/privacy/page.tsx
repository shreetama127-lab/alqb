"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: July 2026</p>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800">
          This policy is being finalised. For any questions about your data in the meantime, contact info.alqb@gmail.com.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-zinc-600">
        <section>
          <h2 className="text-xl font-bold text-zinc-900">Who we are</h2>
          <p className="mt-3">
            ALQB is a registered company providing online question banks for A-Level and IB students. You can contact us at info.alqb@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900">What we collect</h2>
          <p className="mt-3">
            When you create an account we collect your first name and email address. As you use the service we store your answers, notes, flagged questions, study streak and any exam date you set, so that we can show you your progress.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900">How we use it</h2>
          <p className="mt-3">
            We use this information to run your account, show your progress, improve our questions, and contact you about your account. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900">Age</h2>
          <p className="mt-3">
            You must be at least 16 years old to hold an ALQB account. Users under 16 may only use the service with the supervision and consent of an adult.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900">Your rights</h2>
          <p className="mt-3">
            You have the right to access, correct or delete the personal data we hold about you, and to withdraw consent at any time. To make a request, email info.alqb@gmail.com.
          </p>
        </section>
      </div>

      <div className="mt-10 flex justify-center gap-3">
        <Link href="/terms" className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          Terms of Use
        </Link>
        <Link href="/" className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          ← Home
        </Link>
      </div>
    </main>
  );
}