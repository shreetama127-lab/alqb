"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type QRow = { topic: string | null; module: string | null; difficulty: string | null };
type TopicCount = { topic: string; count: number };

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

export default function StudyPage() {
  const router = useRouter();
  const [rows, setRows] = useState<QRow[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("questions").select("topic, module, difficulty");
      if (data) setRows(data as QRow[]);
      setLoading(false);
    }
    load();
  }, []);

  // Which modules exist in the data (M2–M6), sorted
  const modules = Array.from(new Set(rows.map((r) => r.module || "")))
    .filter(Boolean)
    .sort();

  // Rows that pass the current module + difficulty filters
  const visibleRows = rows.filter((r) => {
    if (selectedModules.length > 0 && !selectedModules.includes(r.module || "")) return false;
    if (difficulty !== "All" && r.difficulty !== difficulty) return false;
    return true;
  });

  // Topic counts within the filtered rows
  const countsMap: Record<string, number> = {};
  const order: string[] = [];
  visibleRows.forEach((r) => {
    const t = r.topic || "Other";
    if (!(t in countsMap)) {
      countsMap[t] = 0;
      order.push(t);
    }
    countsMap[t] += 1;
  });
  const topics: TopicCount[] = order.map((t) => ({ topic: t, count: countsMap[t] }));

  function toggleTopic(topic: string) {
    setSelectedTopics((s) => (s.includes(topic) ? s.filter((t) => t !== topic) : [...s, topic]));
  }
  function toggleModule(m: string) {
    setSelectedModules((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  }
  function selectAll() {
    setSelectedTopics(topics.map((t) => t.topic));
  }
  function clearAll() {
    setSelectedTopics([]);
  }

  const totalVisible = topics.reduce((s, t) => s + t.count, 0);
  const selectedCount = topics
    .filter((t) => selectedTopics.includes(t.topic))
    .reduce((sum, t) => sum + t.count, 0);

  function startSession() {
    const params = new URLSearchParams();
    const activeTopics = selectedTopics.filter((t) => topics.some((x) => x.topic === t));
    if (activeTopics.length > 0) params.set("topics", activeTopics.join("~~"));
    if (selectedModules.length > 0) params.set("modules", selectedModules.join("~~"));
    if (difficulty !== "All") params.set("difficulty", difficulty);
    router.push("/question?" + params.toString());
  }

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading topics…</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 pb-32">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Choose what to study</h1>
      <p className="mt-2 text-zinc-500">Filter by module and difficulty, pick your topics, or study everything.</p>

      <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Module</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {modules.map((m) => {
            const isOn = selectedModules.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleModule(m)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  isOn ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"
                }`}
              >
                {m}
              </button>
            );
          })}
          {selectedModules.length > 0 && (
            <button onClick={() => setSelectedModules([])} className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-600">
              Clear modules
            </button>
          )}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-zinc-400">Difficulty</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                difficulty === d ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3 text-sm font-semibold">
        <button onClick={selectAll} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-emerald-700 transition-colors hover:bg-emerald-50">
          Select all
        </button>
        <button onClick={clearAll} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-zinc-600 transition-colors hover:bg-zinc-50">
          Clear
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {topics.map((t) => {
          const isOn = selectedTopics.includes(t.topic);
          return (
            <button
              key={t.topic}
              onClick={() => toggleTopic(t.topic)}
              className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                isOn ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white hover:border-emerald-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-bold ${isOn ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 text-transparent"}`}>
                  ✓
                </span>
                <span className="font-semibold text-zinc-800">{t.topic}</span>
              </span>
              <span className="text-sm font-medium text-zinc-400">{t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-emerald-100 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-semibold text-zinc-600">
            {selectedTopics.length === 0
              ? `All shown topics · ${totalVisible} questions`
              : `${selectedCount} questions selected`}
          </p>
          <button onClick={startSession} className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
            Start Session →
          </button>
        </div>
      </div>
    </main>
  );
}