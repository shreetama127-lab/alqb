"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { MODULE_TITLES } from "@/app/lib/plans";

type TopicInfo = { topic: string; count: number };
type ModuleGroup = { module: string; title: string; topics: TopicInfo[] };
type CustomSet = { id: number; name: string; topics: string[]; created_at: string };

const PAPERS: Record<string, string[]> = {
  "Paper 1": ["M2", "M3", "M5"],
  "Paper 2": ["M2", "M4", "M6"],
  "Paper 3": ["M2", "M3", "M4", "M5", "M6"],
};

export default function CustomisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ModuleGroup[]>([]);
  const [topicToModule, setTopicToModule] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<CustomSet[]>([]);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setLoggedIn(false); setLoading(false); return; }
      setLoggedIn(true);
      setUserId(userData.user.id);

      const { data: qData } = await supabase.from("questions").select("topic, module");
      const byModule: Record<string, Record<string, number>> = {};
      const order: string[] = [];
      const t2m: Record<string, string> = {};
      (qData || []).forEach((r) => {
        const m = r.module || "Other";
        const t = r.topic || "Other";
        if (!byModule[m]) { byModule[m] = {}; order.push(m); }
        byModule[m][t] = (byModule[m][t] || 0) + 1;
        t2m[t] = m;
      });
      order.sort();
      const gs: ModuleGroup[] = order.map((m) => ({
        module: m,
        title: MODULE_TITLES[m] || m,
        topics: Object.entries(byModule[m]).map(([topic, count]) => ({ topic, count })),
      }));
      setGroups(gs);
      setTopicToModule(t2m);

      const { data: sets } = await supabase
        .from("custom_sets")
        .select("id, name, topics, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setSaved((sets || []) as CustomSet[]);
      setLoading(false);
    }
    load();
  }, []);

  function toggleTopic(t: string) {
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  }
  function toggleModuleOpen(m: string) {
    setOpenModules((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  }
  function applyPaper(paper: string) {
    const mods = PAPERS[paper];
    const topics = Object.entries(topicToModule).filter(([, m]) => mods.includes(m)).map(([t]) => t);
    setSelected(topics);
    if (!name) setName(paper);
  }
  function clearAll() { setSelected([]); }

  async function saveSet() {
    if (!userId || selected.length === 0 || !name.trim()) return;
    const { data, error } = await supabase
      .from("custom_sets")
      .insert({ user_id: userId, name: name.trim(), topics: selected })
      .select("id, name, topics, created_at")
      .single();
    if (error) { console.error(error); return; }
    if (data) setSaved((s) => [data as CustomSet, ...s]);
    setSaveMsg("Saved! You can launch it any time below.");
    setName("");
    setSelected([]);
    setTimeout(() => setSaveMsg(""), 4000);
  }

  function launch(topics: string[]) {
    const params = new URLSearchParams();
    params.set("topics", topics.join("~~"));
    router.push("/question?" + params.toString());
  }

  async function deleteSet(id: number) {
    if (!confirm("Delete this set?")) return;
    await supabase.from("custom_sets").delete().eq("id", id);
    setSaved((s) => s.filter((x) => x.id !== id));
  }

  if (loading)
    return <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6"><p className="text-zinc-400">Loading…</p></main>;

  if (!loggedIn)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-lg text-zinc-600">Please log in to build custom sets.</p>
        <Link href="/login" className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">Log In</Link>
      </main>
    );

  const selectedCount = selected.length;return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Customise sets</h1>
      <p className="mt-2 text-zinc-600">Build your own set from a preset paper or your own mix of topics, then save it to reuse any time.</p>

      <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900">Quick presets</h2>
        <p className="mt-1 text-sm text-zinc-500">Based on the OCR A-Level Biology paper structure.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.keys(PAPERS).map((paper) => (
            <button key={paper} onClick={() => applyPaper(paper)} className="rounded-2xl border-2 border-emerald-200 bg-white px-6 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400">
              <span className="block font-extrabold text-emerald-700">{paper}</span>
              <span className="block text-xs font-semibold text-zinc-500">Modules {PAPERS[paper].map((m) => m.replace("M", "")).join(", ")}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Or pick topics</h2>
          <button onClick={clearAll} className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-50">Clear</button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {groups.map((g) => {
            const isOpen = openModules.includes(g.module);
            const chosenHere = g.topics.filter((t) => selected.includes(t.topic)).length;
            return (
              <div key={g.module} className="rounded-2xl border-2 border-zinc-200 bg-white">
                <button onClick={() => toggleModuleOpen(g.module)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-bold text-zinc-800">
                    {g.title}
                    {chosenHere > 0 && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{chosenHere} selected</span>}
                  </span>
                  <span className="text-emerald-600">{isOpen ? "▴" : "▾"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-100 px-5 py-4">
                    <div className="flex flex-col gap-2">
                      {g.topics.map((t) => {
                        const on = selected.includes(t.topic);
                        return (
                          <button key={t.topic} onClick={() => toggleTopic(t.topic)} className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-all ${on ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-emerald-300"}`}>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ${on ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 text-transparent"}`}>✓</span>
                            <span className="font-semibold text-zinc-800">{t.topic}</span>
                            <span className="ml-auto text-xs font-semibold text-zinc-400">{t.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900">Save this set</h2>
        <p className="mt-1 text-sm text-zinc-500">{selectedCount} topic{selectedCount === 1 ? "" : "s"} selected.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name your set (e.g. Weak topics, Paper 2 revision)" className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none focus:border-emerald-400" />
          <button onClick={saveSet} disabled={selectedCount === 0 || !name.trim()} className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none">
            Save set
          </button>
        </div>
        {saveMsg && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{saveMsg}</p>}
        {selectedCount > 0 && (
          <button onClick={() => launch(selected)} className="mt-3 text-sm font-semibold text-emerald-700 hover:underline">
            Or launch this selection now without saving →
          </button>
        )}
      </div>

      {saved.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-zinc-900">Your saved sets</h2>
          <div className="mt-4 flex flex-col gap-3">
            {saved.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div>
                  <p className="font-bold text-zinc-900">{s.name}</p>
                  <p className="text-sm text-zinc-500">{s.topics.length} topic{s.topics.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => launch(s.topics)} className="rounded-full bg-emerald-700 px-6 py-2.5 font-bold text-white transition-colors hover:bg-emerald-800">▶ Start</button>
                  <button onClick={() => deleteSet(s.id)} className="rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 transition-colors hover:border-red-300 hover:text-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}