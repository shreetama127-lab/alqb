"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName } },
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Account created! You can now log in.");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-emerald-50 p-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-700">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">Start mastering A-Level Biology &amp; Chemistry.</p>

        <div className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400"
          />
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
          onClick={handleSignUp}
          disabled={loading || !email || !password}
          className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {loading ? "Creating account…" : "Create Free Account"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-zinc-600">{message}</p>
        )}
      </div>
    </main>
  );
}