"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already logged in? Skip the marketing page — go straight to the dashboard.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/dashboard";
    });
  }, []);

  function showMessage(text: string, error: boolean) {
    setMessage(text);
    setIsError(error);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName } },
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

  return (
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
          <p className="mt-4 text-lg text-zinc-500">
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
                <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
              )}
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
            </div>

            <button type="submit" disabled={loading || !email || !password} className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none">
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
          <p className="mt-2 text-sm text-zinc-500">Mapped to your spec.</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">💡</p>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">Explained answers</h3>
          <p className="mt-2 text-sm text-zinc-500">Every option explained.</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">📈</p>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">Track progress</h3>
          <p className="mt-2 text-sm text-zinc-500">See your accuracy grow.</p>
        </div>
      </div>
    </main>
  );
}