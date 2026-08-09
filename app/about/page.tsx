"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [firstName, setFirstName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [mlEmail, setMlEmail] = useState("");
  const [mlMsg, setMlMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/dashboard";
    });
  }, []);

  function showMessage(text: string, error: boolean) {
    setMessage(text);
    setIsError(error);
  }

  async function joinMailingList() {
    if (!mlEmail || !mlEmail.includes("@")) { setMlMsg("Please enter a valid email."); return; }
    const { error } = await supabase.from("mailing_list").insert({ email: mlEmail.toLowerCase().trim() });
    if (error && !error.message.includes("duplicate")) { setMlMsg("Something went wrong — please try again."); return; }
    setMlMsg("You're on the list! 🎉");
    setMlEmail("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            school: school,
            agreed_terms_at: new Date().toISOString(),
            confirmed_age_16: true,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setMode("login");
          showMessage("You already have an account — log in below.", true);
        } else {
          showMessage(error.message, true);
        }
        setLoading(false);
        return;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMode("login");
        showMessage("You already have an account — log in below.", true);
        setLoading(false);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        showMessage("Account created! You can now log in.", false);
        setMode("login");
        setLoading(false);
      } else {
        if (data.user) {
          await supabase.from("user_profiles").upsert({
            user_id: data.user.id,
            school: school,
            updated_at: new Date().toISOString(),
          });
        }
        window.location.href = "/dashboard";
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          showMessage("Wrong email or password — double-check and try again.", true);
        } else {
          showMessage(error.message, true);
        }
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    }
  }

  const canSubmit =
    email &&
    password &&
    (mode === "login" || (firstName && school && agreeTerms && confirmAge));return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <img src="/ALQB%20logo.png" alt="ALQB logo" className="h-16 w-auto" />
            <span className="text-5xl font-extrabold tracking-tight text-emerald-700">ALQB</span>
          </div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight text-zinc-900">
            Master A-Level Biology &amp; Chemistry.
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Exam-board specific questions with instant explanations, timed practice, and progress tracking.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-lg shadow-emerald-700/5">
          <div className="flex rounded-full bg-emerald-50 p-1">
            <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${mode === "signup" ? "bg-emerald-700 text-white" : "text-emerald-700"}`}>
              Create Account
            </button>
            <button type="button" onClick={() => { setMode("login"); setMessage(""); }} className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${mode === "login" ? "bg-emerald-700 text-white" : "text-emerald-700"}`}>
              Log In
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mt-6 flex flex-col gap-3">
              {mode === "signup" && (
                <>
                  <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
                  <input type="text" placeholder="School or institution name" value={school} onChange={(e) => setSchool(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
                </>
              )}
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
            </div>

            {mode === "signup" && (
              <div className="mt-5 flex flex-col gap-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={confirmAge} onChange={(e) => setConfirmAge(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600" />
                  <span className="text-sm text-zinc-600">I confirm I am 16 or over.</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600" />
                  <span className="text-sm text-zinc-600">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="font-bold text-emerald-700 hover:underline">Terms of Use</Link>
                    {" "}and{" "}
                    <Link href="/privacy" target="_blank" className="font-bold text-emerald-700 hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              </div>
            )}

            <button type="submit" disabled={loading || !canSubmit} className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none">
              {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Log In →"}
            </button>
          </form>

          {message && (
            <p className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-20 grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">📚</p>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">Exam-board specific</h3>
          <p className="mt-2 text-sm text-zinc-600">Mapped to your spec.</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">💡</p>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">Explained answers</h3>
          <p className="mt-2 text-sm text-zinc-600">Every option explained.</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">📈</p>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">Track progress</h3>
          <p className="mt-2 text-sm text-zinc-600">See your accuracy grow.</p>
        </div>
      </div>

      <div className="mt-16 rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-zinc-900">📬 Join our mailing list</h2>
        <p className="mt-2 text-zinc-600">Be the first to hear about new question banks, features and study tips.</p>
        <div className="mt-5 flex flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row">
          <input type="email" placeholder="Your email" value={mlEmail} onChange={(e) => setMlEmail(e.target.value)} className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
          <button onClick={joinMailingList} className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
            Sign up
          </button>
        </div>
        {mlMsg && <p className="mt-3 text-sm font-semibold text-emerald-700">{mlMsg}</p>}
      </div>

      <div className="mt-12 flex justify-center gap-6 text-sm font-semibold text-zinc-500">
        <Link href="/about" className="hover:text-emerald-700">About us</Link>
        <Link href="/contact" className="hover:text-emerald-700">Contact us</Link>
        <Link href="/terms" className="hover:text-emerald-700">Terms of Use</Link>
        <Link href="/privacy" className="hover:text-emerald-700">Privacy Policy</Link>
      </div>
    </main>
  );
}