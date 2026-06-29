"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName } },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setMessage("Account created! You can now log in.");
        setMode("login");
        setLoading(false);
      } else {
        router.push("/study");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
      } else {
        router.push("/study");
      }
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
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
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              mode === "signup" ? "bg-emerald-700 text-white" : "text-emerald-700"
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              mode === "login" ? "bg-emerald-700 text-white" : "text-emerald-700"
            }`}
          >
            Log In
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Log In"}
        </button>

        {message && <p className="mt-4 text-center text-sm text-zinc-600">{message}</p>}
      </div>
    </main>
  );
}