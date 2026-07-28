"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

const ADJECTIVES = ["Covalent","Ionic","Mitotic","Meiotic","Enzymatic","Aerobic","Anaerobic","Hydrophilic","Hydrophobic","Catalytic","Osmotic","Polar","Saturated","Alkaline","Buffered","Helical","Ribosomal","Cytoplasmic","Allosteric","Exothermic","Endothermic","Photosynthetic","Diploid","Haploid","Turgid"];
const NOUNS = ["Otter","Newt","Axolotl","Badger","Ferret","Heron","Ibex","Kestrel","Lemur","Marmot","Narwhal","Ocelot","Puffin","Quokka","Raven","Stoat","Tapir","Urchin","Vole","Walrus","Yak","Mitochondrion","Ribosome","Chloroplast","Flagellum","Enzyme","Beaker","Pipette"];

function randomHandle() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}${n}${Math.floor(Math.random() * 90) + 10}`;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState<string | null>(null);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState(false);

  const [handleMsg, setHandleMsg] = useState("");
  const [resetText, setResetText] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setLoggedIn(false); setLoading(false); return; }
      setLoggedIn(true);
      setUserId(userData.user.id);
      setEmail(userData.user.email || "");
      const { data: h } = await supabase.from("user_handles").select("handle").eq("user_id", userData.user.id).maybeSingle();
      if (h?.handle) setHandle(h.handle);
      setLoading(false);
    }
    load();
  }, []);

  async function changePassword() {
    setPassMsg("");
    if (newPass.length < 6) { setPassMsg("Password must be at least 6 characters."); setPassErr(true); return; }
    if (newPass !== confirmPass) { setPassMsg("Passwords don't match."); setPassErr(true); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setBusy(false);
    if (error) { setPassMsg(error.message); setPassErr(true); }
    else { setPassMsg("Password updated."); setPassErr(false); setNewPass(""); setConfirmPass(""); }
  }

  async function regenerateHandle() {
    if (!userId) return;
    setHandleMsg("");
    setBusy(true);
    for (let i = 0; i < 6; i++) {
      const candidate = randomHandle();
      const { error } = await supabase.from("user_handles").upsert({ user_id: userId, handle: candidate });
      if (!error) { setHandle(candidate); setHandleMsg("New name generated!"); break; }
    }
    setBusy(false);
  }

  async function resetProgress() {
    if (!userId || resetText !== "RESET") return;
    setBusy(true);
    await supabase.from("answers").delete().eq("user_id", userId);
    await supabase.from("notes").delete().eq("user_id", userId);
    await supabase.from("flags").delete().eq("user_id", userId);
    setBusy(false);
    setResetMsg("All your progress has been reset.");
    setResetText("");
  }

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading…</p>
      </main>
    );

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to see your settings.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Log In</Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Profile &amp; settings</h1>

      <div className="mt-8 flex flex-col gap-6">
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Your account</h2>
          <p className="mt-3 text-sm text-zinc-500">Email</p>
          <p className="font-semibold text-zinc-800">{email}</p>
          <p className="mt-4 text-sm text-zinc-500">Your discussion name</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-4 py-1.5 font-bold text-emerald-700">{handle || "Not set yet"}</span>
            <button onClick={regenerateHandle} disabled={busy} className="rounded-full border border-emerald-200 px-4 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50">
              🎲 Regenerate
            </button>
          </div>
          {handleMsg && <p className="mt-2 text-sm font-semibold text-emerald-600">{handleMsg}</p>}
          <p className="mt-2 text-xs text-zinc-400">This anonymous name is shown next to your comments. A name is created the first time you post.</p>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Change password</h2>
          <div className="mt-4 flex flex-col gap-3">
            <input type="password" placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
            <input type="password" placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
            <button onClick={changePassword} disabled={busy || !newPass || !confirmPass} className="rounded-full bg-emerald-700 px-6 py-2.5 font-bold text-white transition-colors hover:bg-emerald-800 disabled:bg-zinc-300">
              Update password
            </button>
          </div>
          {passMsg && <p className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${passErr ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{passMsg}</p>}
        </section>

        <section className="rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Reset progress</h2>
          <p className="mt-2 text-sm text-zinc-600">
            This permanently deletes all your answers, notes and flags. Your account stays, but your history is wiped. This can&apos;t be undone.
          </p>
          {resetMsg ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{resetMsg}</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-zinc-600">Type <span className="rounded bg-white px-1.5 py-0.5 font-mono text-red-600">RESET</span> to confirm:</p>
              <input type="text" value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="RESET" className="rounded-xl border border-red-200 px-4 py-3 text-zinc-900 outline-none focus:border-red-400" />
              <button onClick={resetProgress} disabled={busy || resetText !== "RESET"} className="rounded-full bg-red-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300">
                Reset all my progress
              </button>
            </div>
          )}
        </section>
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}