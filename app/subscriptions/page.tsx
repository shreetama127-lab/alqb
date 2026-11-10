"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { PLANS, PRICE_OPTIONS, Plan } from "@/app/lib/plans";
import { isFounder, allLivePlanIds, trialActive, trialHoursLeft } from "@/app/lib/access";
import { STRIPE_PRICES } from "@/app/lib/stripe-prices";

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [trialOn, setTrialOn] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [qualification, setQualification] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Record<string, string>>({});
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setLoggedIn(false); setLoading(false); return; }
      setLoggedIn(true);
      setUserId(userData.user.id);
      setUserEmail(userData.user.email || null);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_id, status, expires_at")
        .eq("user_id", userData.user.id)
        .eq("status", "active");

      const now = Date.now();
      const owned = (subs || [])
        .filter((s) => !s.expires_at || new Date(s.expires_at).getTime() > now)
        .map((s) => s.plan_id);

      const founder = isFounder(userData.user.email);
      const ownedOrFounder = founder ? [...new Set([...owned, ...allLivePlanIds()])] : owned;
      setActiveIds(ownedOrFounder);

      // Trial status (founders never need the trial)
      const createdAt = userData.user.created_at;
      setTrialOn(!founder && trialActive(createdAt));
      setHoursLeft(founder ? 0 : trialHoursLeft(createdAt));
      setLoading(false);
    }
    load();
  }, []);

  async function startCheckout(planId: string, term: string) {
    if (!userId) return;
    setCheckingOut(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, term, userId, userEmail }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert("Something went wrong starting checkout."); setCheckingOut(null); }
    } catch {
      alert("Something went wrong starting checkout.");
      setCheckingOut(null);
    }
  }

  if (loading)
    return <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6"><p className="text-zinc-400">Loading plans…</p></main>;

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to view subscriptions.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Log In</Link>
      </main>
    );

  const qualifications = Array.from(new Set(PLANS.map((p) => p.qualification)));
  const subjects = qualification
    ? Array.from(new Set(PLANS.filter((p) => p.qualification === qualification).map((p) => p.subject)))
    : [];
  const variants: Plan[] =
    qualification && subject
      ? PLANS.filter((p) => p.qualification === qualification && p.subject === subject)
      : [];
  const myPlans = PLANS.filter((p) => activeIds.includes(p.id));

  function reset() { setQualification(null); setSubject(null); }
  function termFor(planId: string) { return selectedTerm[planId] || "1month"; }
  function hasStripe(planId: string) { return !!STRIPE_PRICES[planId]; }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Subscriptions</h1>
      <p className="mt-2 text-zinc-600">Choose a question bank and the plan length that suits you.</p>

      {trialOn && (
        <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4">
          <p className="font-bold text-amber-900">🎉 Your free trial is active — {hoursLeft}h left</p>
          <p className="mt-1 text-sm text-amber-800">You have full access to every bank for now. Buy any bank below to keep access once your trial ends.</p>
        </div>
      )}

      {myPlans.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Your active subscriptions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {myPlans.map((p) => (
              <Link key={p.id} href="/study" className="flex items-center gap-3 rounded-2xl border-2 border-emerald-300 bg-white px-5 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500">
                <span className="text-2xl">{p.emoji}</span>
                <span>
                  <span className="block font-bold text-zinc-900">{p.title}</span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700">Active · Start studying →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-400">
          <span className={qualification ? "text-emerald-700" : "text-zinc-900"}>1. Qualification</span>
          <span>›</span>
          <span className={subject ? "text-emerald-700" : qualification ? "text-zinc-900" : ""}>2. Subject</span>
          <span>›</span>
          <span className={subject ? "text-zinc-900" : ""}>3. Choose your bank</span>
          {(qualification || subject) && (
            <button onClick={reset} className="ml-auto rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-50">Start over</button>
          )}
        </div>

        {!qualification && (
          <div className="mt-6">
            <p className="font-bold text-zinc-900">Which qualification are you studying?</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {qualifications.map((qual) => (
                <button key={qual} onClick={() => setQualification(qual)} className="rounded-2xl border-2 border-zinc-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg">
                  <p className="text-3xl">{qual === "A-Level" ? "🎓" : "🌍"}</p>
                  <p className="mt-3 text-lg font-extrabold text-zinc-900">{qual}</p>
                  <p className="mt-1 text-sm text-zinc-500">{qual === "A-Level" ? "OCR and AQA question banks" : "Standard and Higher Level"}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {qualification && !subject && (
          <div className="mt-6">
            <p className="font-bold text-zinc-900">Which subject?</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {subjects.map((s) => (
                <button key={s} onClick={() => setSubject(s)} className="rounded-2xl border-2 border-zinc-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg">
                  <p className="text-3xl">{s === "Biology" ? "🧬" : "🧪"}</p>
                  <p className="mt-3 text-lg font-extrabold text-zinc-900">{s}</p>
                  <p className="mt-1 text-sm text-zinc-500">{qualification}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setQualification(null)} className="mt-5 text-sm font-semibold text-emerald-700 hover:underline">← Back to qualifications</button>
          </div>
        )}

        {qualification && subject && (
          <div className="mt-6">
            <p className="font-bold text-zinc-900">{qualification === "IB" ? "Standard or Higher Level?" : "Which exam board?"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {variants.map((plan) => {
                const isActive = activeIds.includes(plan.id);
                const term = termFor(plan.id);
                const chosen = PRICE_OPTIONS.find((o) => o.id === term) || PRICE_OPTIONS[0];
                const buyable = hasStripe(plan.id);
                return (
                  <div key={plan.id} className={`relative rounded-2xl border-2 p-6 shadow-sm ${isActive ? "border-emerald-400 bg-white" : "border-zinc-200 bg-white"}`}>
                    {isActive && <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Active</span>}
                    <p className="text-3xl">{plan.emoji}</p>
                    <p className="mt-3 text-lg font-extrabold text-zinc-900">{plan.variant}</p>
                    <p className="mt-1 text-sm text-zinc-500">{plan.title}</p>

                    {!isActive && (
                      <>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {PRICE_OPTIONS.map((o) => (
                            <button key={o.id} onClick={() => setSelectedTerm((s) => ({ ...s, [plan.id]: o.id }))} className={`rounded-xl border-2 px-2 py-2 text-center transition-colors ${term === o.id ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-emerald-300"}`}>
                              <span className="block text-xs font-semibold text-zinc-500">{o.label}</span>
                              <span className="block text-sm font-extrabold text-emerald-700">{o.price}</span>
                            </button>
                          ))}
                        </div>
                        {buyable ? (
                          <button onClick={() => startCheckout(plan.id, term)} disabled={checkingOut === plan.id} className="mt-4 w-full rounded-full bg-emerald-700 px-6 py-2.5 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:bg-zinc-300">
                            {checkingOut === plan.id ? "Starting…" : `Buy — ${chosen.price}`}
                          </button>
                        ) : (
                          <button disabled className="mt-4 w-full cursor-not-allowed rounded-full border-2 border-zinc-200 bg-zinc-50 px-6 py-2.5 font-bold text-zinc-400">Coming soon</button>
                        )}
                      </>
                    )}

                    {isActive && (
                      <Link href="/study" className="mt-4 block rounded-full bg-emerald-700 px-6 py-2.5 text-center font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Start studying →</Link>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSubject(null)} className="mt-5 text-sm font-semibold text-emerald-700 hover:underline">← Back to subjects</button>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}