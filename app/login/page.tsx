"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
    } else {
      router.push("/question");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-emerald-50 p-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-700">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Log in to continue studying.</p>
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
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
        {message && <p className="mt-4 text-center text-sm text-zinc-600">{message}</p>}
      </div>
    </main>
  );
}