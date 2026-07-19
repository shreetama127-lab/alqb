"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Plan = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  price: string;
  period: string;
};

// Every plan available. Add new ones here.
export const PLANS: Plan[] = [
  { id: "ocr-biology", title: "OCR A-Level Biology", subtitle: "Full question bank, mapped to the OCR (A) spec", emoji: "🧬", price: "£40", period: "per year" },
  { id: "aqa-biology", title: "AQA A-Level Biology", subtitle: "Full question bank, mapped to the AQA spec", emoji: "🌿", price: "£40", period: "per year" },
  { id: "chemistry", title: "A-Level Chemistry", subtitle: "Full question bank for A-Level Chemistry", emoji: "🧪", price: "£40", period: "per year" },
  { id: "ib-biology-sl", title: "IB Biology (Standard Level)", subtitle: "Question bank for IB Biology SL", emoji: "🌍", price: "£40", period: "per year" },
  { id: "ib-biology-hl", title: "IB Biology (Higher Level)", subtitle: "Question bank for IB Biology HL", emoji: "🌏", price: "£40", period: "per year" },
];

// Plans that are free/owned for everyone right now.
export const FREE_PLAN_IDS = ["ocr-biology"];

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeIds, setActiveIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_id, status")
        .eq("user_id", userData.user.id)
        .eq("status", "active");

      const owned = (subs || []).map((s) => s.plan_id);
      setActiveIds([...new Set([...owned, ...FREE_PLAN_IDS])]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading plans…</p>
      </main>
    );

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to view subscriptions.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
          Log In
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Subscriptions</h1>
      <p className="mt-2 text-zinc-500">Choose a question bank. Each subscription gives you a full year of access.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isActive = activeIds.includes(plan.id);
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border-2 p-7 shadow-sm transition-all ${
                isActive ? "border-emerald-400 bg-white" : "border-zinc-100 bg-white hover:border-emerald-200"
              }`}
            >
              {isActive && (
                <span className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Active
                </span>
              )}
              <p className="text-4xl">{plan.emoji}</p>
              <h3 className="mt-4 text-xl font-extrabold text-zinc-900">{plan.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{plan.subtitle}</p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700">{plan.price}</span>
                <span className="text-sm font-semibold text-zinc-400">{plan.period}</span>
              </div>

              {isActive ? (
                <Link
                  href="/study"
                  className="mt-5 block rounded-full bg-emerald-700 px-6 py-3 text-center font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  Start studying →
                </Link>
              ) : (
                <button
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-full border-2 border-zinc-200 bg-zinc-50 px-6 py-3 font-bold text-zinc-400"
                >
                  Coming soon
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center">
        <p className="text-sm text-zinc-600">
          Payments aren&apos;t live yet — new question banks will be available to purchase soon.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}