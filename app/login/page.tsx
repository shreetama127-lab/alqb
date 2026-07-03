"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("invalid")) {
        setMessage("Wrong email or password — double-check and try again.");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-lg shadow-emerald-700/5">
        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-700">Welcome back</h1>
        <p className="mt-1 text-zinc-500">Log in to continue studying.</p>

        <form onSubmit={handleSubmit}>
          <div className="mt-6 flex flex-col gap-3">
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
            type="submit"
            disabled={loading || !email || !password}
            className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
          >
            {loading ? "Please wait…" : "Log In"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account yet?{" "}
          <Link href="/" className="font-bold text-emerald-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}