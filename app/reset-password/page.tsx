"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setIsError(true);
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords don't match.");
      setIsError(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setIsError(true);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-lg shadow-emerald-700/5">
        {done ? (
          <div className="text-center">
            <p className="text-4xl">✅</p>
            <h1 className="mt-4 text-2xl font-extrabold text-emerald-700">Password updated</h1>
            <p className="mt-2 text-zinc-500">Taking you to your dashboard…</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-700">Set a new password</h1>
            <p className="mt-1 text-zinc-500">Choose a new password for your account.</p>

            <form onSubmit={handleSubmit}>
              <div className="mt-6 flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="mt-5 w-full rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>

            {message && (
              <p className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}