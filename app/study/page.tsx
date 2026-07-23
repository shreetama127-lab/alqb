"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type QRow = { id: number; topic: string | null; module: string | null };
type TopicInfo = { topic: string; count: number; done: number };
type ModuleGroup = { module: string; title: string; topics: TopicInfo[]; count: number; done: number };

const MODULE_TITLES: Record<string, string> = {
  M2: "Module 2 — Foundations in Biology",
  M3: "Module 3 — Exchange and Transport",
  M4: "Module 4 — Biodiversity, Evolution and Disease",
  M5: "Module 5 — Communication, Homeostasis and Energy",
  M6: "Module 6 — Genetics, Evolution and Ecosystems",
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const YIELDS = ["High", "Medium", "Low"];
const STATUSES = [
  { value: "unattempted", label: "Unattempted" },
  { value: "correct", label: "Previously correct" },
  { value: "incorrect", label: "Previously incorrect" },
];

export default function StudyPage() {
  const router = useRouter();
  const [rows, setRows] = useState<QRow[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const [amount, setAmount] = useState(20);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [yields, setYields] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  const [attemptedPct, setAttemptedPct] = useState(0);
  const [daysStudied, setDaysStudied] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [hasAnswers, setHasAnswers] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: qData } = await supabase.from("questions").select("id, topic, module");
      if (qData) {
        setRows(qData as QRow[]);
        // every topic selected by default
        const allTopics = Array.from(new Set((qData as QRow[]).map((r) => r.topic || "Other")));
        setSelectedTopics(allTopics);
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && qData) {
        const { data: ans } = await supabase
          .from("answers")
          .select("is_correct, question_id, created_at")
          .eq("user_id", userData.user.id);

        if (ans && ans.length > 0) {
          setHasAnswers(true);
          const uniqueIds = new Set(ans.map((a) => a.question_id));
          setAnsweredIds(uniqueIds);
          setAttemptedPct(Math.round((uniqueIds.size / qData.length) * 100));
          const days = new Set(
            ans.map((a) => new Date(a.created_at).toISOString().slice(0, 10))
          );
          setDaysStudied(days.size);
          const correct = ans.filter((a) => a.is_correct).length;
          setAccuracy(Math.round((correct / ans.length) * 100));
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // build module → topics structure
  const groups: ModuleGroup[] = [];
  const moduleOrder: string[] = [];
  const byModule: Record<string, Record<string, TopicInfo>> = {};
  rows.forEach((r) => {
    const m = r.module || "Other";
    const t = r.topic || "Other";
    if (!byModule[m]) {
      byModule[m] = {};
      moduleOrder.push(m);
    }
    if (!byModule[m][t]) byModule[m][t] = { topic: t, count: 0, done: 0 };
    byModule[m][t].count += 1;
    if (answeredIds.has(r.id)) byModule[m][t].done += 1;
  });
  moduleOrder.sort();
  moduleOrder.forEach((m) => {
    const topics = Object.values(byModule[m]);
    groups.push({
      module: m,
      title: MODULE_TITLES[m] || m,
      topics,
      count: topics.reduce((s, t) => s + t.count, 0),
      done: topics.reduce((s, t) => s + t.done, 0),
    });
  });

  function toggleTopic(topic: string) {
    setSelectedTopics((s) => (s.includes(topic) ? s.filter((t) => t !== topic) : [...s, topic]));
  }
  function toggleModuleOpen(m: string) {
    setOpenModules((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  }
  function toggleModuleAll(g: ModuleGroup) {
    const names = g.topics.map((t) => t.topic);
    const allOn = names.every((n) => selectedTopics.includes(n));
    setSelectedTopics((s) =>
      allOn ? s.filter((t) => !names.includes(t)) : [...new Set([...s, ...names])]
    );
  }
  function toggleIn(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }
  function selectAllTopics() {
    setSelectedTopics(rows.map((r) => r.topic || "Other"));
  }
  function clearAllTopics() {
    setSelectedTopics([]);
  }

  const selectedCount = rows.filter((r) => selectedTopics.includes(r.topic || "Other")).length;

  function launchSession() {
    const params = new URLSearchParams();
    if (selectedTopics.length > 0) params.set("topics", selectedTopics.join("~~"));
    if (difficulties.length > 0) params.set("difficulties", difficulties.join("~~"));
    if (yields.length > 0) params.set("yields", yields.join("~~"));
    if (statuses.length > 0) params.set("statuses", statuses.join("~~"));
    params.set("limit", String(amount));
    router.push("/question?" + params.toString());
  }

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading…</p>
      </main>
    );return (
    <main className="mx-auto max-w-4xl px-6 py-10 pb-32">
      {hasAnswers && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white px-6 py-4 shadow-sm">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-2xl font-extrabold text-zinc-900">{attemptedPct}%</p>
              <p className="text-xs font-semibold text-zinc-500">of questions attempted</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white px-6 py-4 shadow-sm">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-2xl font-extrabold text-zinc-900">{daysStudied}</p>
              <p className="text-xs font-semibold text-zinc-500">day{daysStudied === 1 ? "" : "s"} studied</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white px-6 py-4 shadow-sm">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-2xl font-extrabold text-emerald-700">{accuracy}%</p>
              <p className="text-xs font-semibold text-zinc-500">overall accuracy</p>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Choose what to study</h1>
      <p className="mt-2 text-zinc-500">All topics are selected by default. Open a module to pick specific topics.</p>

      <div className="mt-6 flex gap-3 text-sm font-semibold">
        <button onClick={selectAllTopics} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-emerald-700 transition-colors hover:bg-emerald-50">
          Select all
        </button>
        <button onClick={clearAllTopics} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-zinc-600 transition-colors hover:bg-zinc-50">
          Clear
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {groups.map((g) => {
          const isOpen = openModules.includes(g.module);
          const names = g.topics.map((t) => t.topic);
          const allOn = names.every((n) => selectedTopics.includes(n));
          const someOn = names.some((n) => selectedTopics.includes(n));
          const pct = g.count > 0 ? Math.round((g.done / g.count) * 100) : 0;
          return (
            <div key={g.module} className={`rounded-3xl border-2 bg-white shadow-sm transition-all ${someOn ? "border-emerald-200" : "border-zinc-200"}`}>
              <div className="flex items-center gap-4 px-5 py-4">
                <button
                  onClick={() => toggleModuleAll(g)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold ${
                    allOn ? "border-emerald-600 bg-emerald-600 text-white" : someOn ? "border-emerald-500 bg-emerald-100 text-emerald-700" : "border-zinc-300 text-transparent"
                  }`}
                >
                  ✓
                </button>
                <button onClick={() => toggleModuleOpen(g.module)} className="flex flex-1 items-center justify-between gap-4 text-left">
                  <span className="font-bold text-zinc-800">{g.title}</span>
                  <span className="text-emerald-600">{isOpen ? "▴" : "▾"}</span>
                </button>
              </div>

              <div className="px-5 pb-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-zinc-400">{g.done}/{g.count} completed</p>
              </div>

              {isOpen && (
                <div className="border-t border-zinc-100 px-5 py-4">
                  <div className="flex flex-col gap-3">
                    {g.topics.map((t) => {
                      const isOn = selectedTopics.includes(t.topic);
                      const tPct = t.count > 0 ? Math.round((t.done / t.count) * 100) : 0;
                      return (
                        <button
                          key={t.topic}
                          onClick={() => toggleTopic(t.topic)}
                          className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                            isOn ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ${isOn ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 text-transparent"}`}>
                              ✓
                            </span>
                            <span className="font-semibold text-zinc-800">{t.topic}</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${tPct}%` }} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-zinc-400">{t.done}/{t.count} completed</p>
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

      <div className="fixed inset-x-0 bottom-0 border-t border-emerald-100 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-semibold text-zinc-600">{selectedCount} questions selected</p>
          <button
            onClick={() => setShowPopup(true)}
            disabled={selectedCount === 0}
            className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
          >
            Start Session →
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-6 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-zinc-900">Session options</h2>
              <button onClick={() => setShowPopup(false)} className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:text-zinc-600">
                ×
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Number of questions</p>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(selectedCount, 1)}
                    value={amount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) setAmount(Math.min(Math.max(v, 1), Math.max(selectedCount, 1)));
                    }}
                    className="w-20 rounded-xl border border-zinc-200 px-3 py-1.5 text-center font-bold text-emerald-700 outline-none focus:border-emerald-400"
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(selectedCount, 1)}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                  className="mt-3 w-full accent-emerald-600"
                />
                <p className="mt-1 text-xs text-zinc-400">Up to {selectedCount} available</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Difficulty</p>
                <p className="mt-0.5 text-xs text-zinc-400">Select none for all</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => toggleIn(difficulties, setDifficulties, d)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${difficulties.includes(d) ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Yield</p>
                <p className="mt-0.5 text-xs text-zinc-400">Select none for all</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {YIELDS.map((y) => (
                    <button key={y} onClick={() => toggleIn(yields, setYields, y)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${yields.includes(y) ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Question status</p>
                <p className="mt-0.5 text-xs text-zinc-400">Select none for all</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s.value} onClick={() => toggleIn(statuses, setStatuses, s.value)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${statuses.includes(s.value) ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowPopup(false)} className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-600 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
                Back
              </button>
              <button onClick={launchSession} className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
                Start Session →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}