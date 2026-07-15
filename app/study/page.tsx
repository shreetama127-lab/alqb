"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type QRow = { id: number; topic: string | null; module: string | null; difficulty: string | null };
type TopicInfo = { topic: string; count: number; done: number };

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const YIELDS = ["All", "High", "Medium", "Low"];
const AMOUNTS = ["10", "20", "50", "All"];
const STATUSES = [
  { value: "all", label: "All questions" },
  { value: "unattempted", label: "Unattempted" },
  { value: "correct", label: "Previously correct" },
  { value: "incorrect", label: "Previously incorrect" },
];

export default function StudyPage() {
  const router = useRouter();
  const [rows, setRows] = useState<QRow[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [correctIds, setCorrectIds] = useState<Set<number>>(new Set());
  const [incorrectIds, setIncorrectIds] = useState<Set<number>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  // pop-up choices
  const [amount, setAmount] = useState("20");
  const [popDifficulty, setPopDifficulty] = useState("All");
  const [popYield, setPopYield] = useState("All");
  const [status, setStatus] = useState("all");

  const [attemptedPct, setAttemptedPct] = useState(0);
  const [daysStudied, setDaysStudied] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [hasAnswers, setHasAnswers] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: qData } = await supabase
        .from("questions")
        .select("id, topic, module, difficulty");
      if (qData) setRows(qData as QRow[]);

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

          // most recent correctness per question
          const latest: Record<number, boolean> = {};
          ans.forEach((a) => {
            latest[a.question_id] = a.is_correct;
          });
          const cSet = new Set<number>();
          const iSet = new Set<number>();
          Object.entries(latest).forEach(([qid, ok]) => {
            if (ok) cSet.add(Number(qid));
            else iSet.add(Number(qid));
          });
          setCorrectIds(cSet);
          setIncorrectIds(iSet);

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

  const modules = Array.from(new Set(rows.map((r) => r.module || "")))
    .filter(Boolean)
    .sort();

  const visibleRows = rows.filter((r) => {
    if (selectedModules.length > 0 && !selectedModules.includes(r.module || "")) return false;
    if (difficulty !== "All" && r.difficulty !== difficulty) return false;
    return true;
  });

  const infoMap: Record<string, TopicInfo> = {};
  const order: string[] = [];
  visibleRows.forEach((r) => {
    const t = r.topic || "Other";
    if (!(t in infoMap)) {
      infoMap[t] = { topic: t, count: 0, done: 0 };
      order.push(t);
    }
    infoMap[t].count += 1;
    if (answeredIds.has(r.id)) infoMap[t].done += 1;
  });
  const topics: TopicInfo[] = order.map((t) => infoMap[t]);

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

  function launchSession() {
    const params = new URLSearchParams();
    const activeTopics = selectedTopics.filter((t) => topics.some((x) => x.topic === t));
    if (activeTopics.length > 0) params.set("topics", activeTopics.join("~~"));
    if (selectedModules.length > 0) params.set("modules", selectedModules.join("~~"));
    if (popDifficulty !== "All") params.set("difficulty", popDifficulty);
    if (popYield !== "All") params.set("yield", popYield);
    if (amount !== "All") params.set("limit", amount);
    if (status !== "all") params.set("status", status);
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
          const pct = t.count > 0 ? Math.round((t.done / t.count) * 100) : 0;
          return (
            <button
              key={t.topic}
              onClick={() => toggleTopic(t.topic)}
              className={`flex flex-col gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                isOn ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-bold ${isOn ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 text-transparent"}`}>
                    ✓
                  </span>
                  <span className="font-semibold text-zinc-800">{t.topic}</span>
                </span>
                <span className="text-sm font-medium text-zinc-400">{t.done}/{t.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-emerald-100 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-semibold text-zinc-600">
            {selectedTopics.length === 0
              ? `All shown topics · ${totalVisible} questions`
              : `${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"} selected`}
          </p>
          <button onClick={() => setShowPopup(true)} className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
            Start Session →
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-zinc-900">Session options</h2>
              <button onClick={() => setShowPopup(false)} className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:text-zinc-600">
                ×
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Number of questions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AMOUNTS.map((a) => (
                    <button key={a} onClick={() => setAmount(a)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${amount === a ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Difficulty</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => setPopDifficulty(d)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${popDifficulty === d ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Yield (how likely to come up)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {YIELDS.map((y) => (
                    <button key={y} onClick={() => setPopYield(y)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${popYield === y ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Question status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s.value} onClick={() => setStatus(s.value)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${status === s.value ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-emerald-50"}`}>
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