"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import Comments from "@/app/Comments";

type Option = { letter: string; text: string; correct: boolean; explanation: string };
type Resource = { title: string; url: string };
type Question = {
  id: number;
  question_ref?: string | null;
  exam_board?: string | null;
  stem: string;
  topic?: string;
  key_takeaway?: string | null;
  options: Option[];
  resources?: Resource[] | null;
};
type AnswerRecord = Record<number, { selected: string; correct: boolean }>;

const REPORT_EMAIL = "info.alqb@gmail.com";
const TAKEAWAY_HEADINGS = ["key takeaway", "common mistake", "common mistakes", "exam tip", "exam tips"];

function fmt(total: number) {
  const m = Math.floor(Math.abs(total) / 60);
  const s = Math.abs(total) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function paragraphs(text: string) {
  return (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function prepareQuestions(data: Question[]): Question[] {
  return shuffle(data).map((q) => ({
    ...q,
    options: shuffle(q.options).map((opt, i) => ({
      ...opt,
      letter: LETTERS[i] || opt.letter,
    })),
  }));
}

function refCode(q: Question) {
  const board = q.exam_board || "OCR";
  return q.question_ref ? `${board}-${q.question_ref}` : `${board}-${q.id}`;
}

function ExplanationText({ text }: { text: string }) {
  const paras = paragraphs(text);
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-zinc-600">
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function TakeawayText({ text }: { text: string }) {
  const lines = (text || "").split("\n").map((l) => l.trim());
  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {lines.map((line, i) => {
        if (!line) return null;
        const isHeading = TAKEAWAY_HEADINGS.includes(line.toLowerCase().replace(/[:.]$/, ""));
        return isHeading ? (
          <p key={i} className="mt-2 text-xs font-bold uppercase tracking-wide text-indigo-700">{line}</p>
        ) : (
          <p key={i} className="text-sm leading-relaxed text-zinc-700">{line}</p>
        );
      })}
    </div>
  );
}

export default function QuestionPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [pending, setPending] = useState<string | null>(null);
  const [timed, setTimed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [dismissedTimeUp, setDismissedTimeUp] = useState(false);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const [openExplain, setOpenExplain] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<Record<number, { total: number; correct: number }>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [noteSaved, setNoteSaved] = useState(false);
  const [showScore, setShowScore] = useState(true);
  const [showNotesReview, setShowNotesReview] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      const params = new URLSearchParams(window.location.search);
      const split = (key: string) => {
        const v = params.get(key);
        return v ? v.split("~~").filter(Boolean) : [];
      };
      const chosenTopics = split("topics");
      const chosenModules = split("modules");
      const chosenDiffs = split("difficulties");
      const chosenYields = split("yields");
      const chosenStatuses = split("statuses");
      const limitParam = params.get("limit");

      let query = supabase
        .from("questions")
        .select("id, question_ref, exam_board, stem, topic, key_takeaway, options, resources");
      if (chosenTopics.length > 0) query = query.in("topic", chosenTopics);
      if (chosenModules.length > 0) query = query.in("module", chosenModules);
      if (chosenDiffs.length > 0) query = query.in("difficulty", chosenDiffs);
      if (chosenYields.length > 0) query = query.in("yield", chosenYields);

      const { data, error } = await query;
      if (error) {
        console.error("Error loading questions:", error);
        setLoading(false);
        return;
      }

      let list = (data || []) as Question[];

      if (chosenStatuses.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: ans } = await supabase
            .from("answers")
            .select("question_id, is_correct, created_at")
            .eq("user_id", userData.user.id);
          const latest: Record<number, boolean> = {};
          (ans || []).forEach((a) => {
            latest[a.question_id] = a.is_correct;
          });
          list = list.filter((q) => {
            const seen = q.id in latest;
            if (chosenStatuses.includes("unattempted") && !seen) return true;
            if (chosenStatuses.includes("correct") && seen && latest[q.id]) return true;
            if (chosenStatuses.includes("incorrect") && seen && !latest[q.id]) return true;
            return false;
          });
        }
      }

      list = prepareQuestions(list);
      const limit = limitParam ? parseInt(limitParam, 10) : 0;
      if (limit > 0) list = list.slice(0, limit);

      setQuestions(list);

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && list.length > 0) {
        const ids = list.map((q) => q.id);
        const { data: noteRows } = await supabase
          .from("notes")
          .select("question_id, content")
          .eq("user_id", userData.user.id)
          .in("question_id", ids);
        const map: Record<number, string> = {};
        (noteRows || []).forEach((n) => {
          map[n.question_id] = n.content || "";
        });
        setNotes(map);
      }

      setLoading(false);
    }
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!timed || paused) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timed, paused]);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) setPaused(true);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading questions…</p>
      </main>
    );

  if (questions.length === 0)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-zinc-400">No questions match these filters.</p>
        <Link href="/study" className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
          ← Change filters
        </Link>
      </main>
    );

  const q = questions[index];
  const thisAnswer = answers[index];
  const submitted = !!thisAnswer;
  const activeChoice = submitted ? thisAnswer.selected : pending;
  const isFlagged = !!flagged[q.id];
  const thisFeedback = feedback[q.id];
  const thisStats = stats[q.id];
  const thisNote = notes[q.id] || "";
  const showResources = submitted && q.resources && q.resources.length > 0;
  const showTakeaway = submitted && q.key_takeaway && q.key_takeaway.trim().length > 0;

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const totalTime = minutes * 60;
  const remaining = totalTime - elapsed;
  const timeUp = timed && remaining <= 0;
  const showTimeUpPopup = timeUp && !dismissedTimeUp && !finished;

  const notesList = questions
    .filter((qq) => (notes[qq.id] || "").trim().length > 0)
    .map((qq) => ({ stem: qq.stem, topic: qq.topic, content: notes[qq.id] }));

  function endSession() {
    setFinalTime(elapsed);
    setFinished(true);
  }

  if (finished) {
    const byTopic: Record<string, { answered: number; correct: number }> = {};
    Object.entries(answers).forEach(([i, a]) => {
      const t = questions[Number(i)]?.topic || "Other";
      if (!byTopic[t]) byTopic[t] = { answered: 0, correct: 0 };
      byTopic[t].answered += 1;
      if (a.correct) byTopic[t].correct += 1;
    });
    const topicList = Object.entries(byTopic)
      .map(([topic, v]) => ({ topic, ...v, pct: Math.round((v.correct / v.answered) * 100) }))
      .sort((a, b) => a.pct - b.pct);

    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        {showNotesReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-6 backdrop-blur-sm">
            <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-zinc-900">Your notes</h2>
                <button onClick={() => setShowNotesReview(false)} className="rounded-full px-3 py-1 text-2xl text-zinc-400 hover:text-zinc-600">×</button>
              </div>
              {notesList.length === 0 ? (
                <p className="mt-6 text-zinc-500">You didn&apos;t write any notes this session.</p>
              ) : (
                <div className="mt-6 flex flex-col gap-4">
                  {notesList.map((n, i) => (
                    <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                      {n.topic && <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{n.topic}</p>}
                      <p className="mt-1 text-sm font-semibold text-zinc-800">{n.stem}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
          <p className="text-5xl">{accuracy >= 70 ? "🎉" : accuracy >= 40 ? "💪" : "📚"}</p>
          <h1 className="mt-4 text-3xl font-extrabold text-zinc-900">Session complete!</h1>
          <p className="mt-2 text-zinc-500">Here&apos;s how you did.</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-3xl font-extrabold text-emerald-700">{correctCount}</p>
              <p className="text-xs font-semibold text-emerald-700/70">Correct</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-3xl font-extrabold text-red-500">{answeredCount - correctCount}</p>
              <p className="text-xs font-semibold text-red-500/70">Incorrect</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-3xl font-extrabold text-emerald-700">{accuracy}%</p>
              <p className="text-xs font-semibold text-emerald-700/70">Accuracy</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-3xl font-extrabold text-zinc-700">{finalTime > 0 ? fmt(finalTime) : "—"}</p>
              <p className="text-xs font-semibold text-zinc-500">Time taken</p>
            </div>
          </div>

          {topicList.length > 0 && (
            <div className="mt-8 text-left">
              <h2 className="text-lg font-bold text-zinc-900">Performance by topic</h2>
              <div className="mt-4 flex flex-col gap-4">
                {topicList.map((t) => {
                  const colour = t.pct >= 70 ? "#059669" : t.pct >= 40 ? "#d97706" : "#dc2626";
                  return (
                    <div key={t.topic}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-zinc-700">{t.topic}</span>
                        <span className="font-bold" style={{ color: colour }}>
                          {t.pct}% <span className="font-normal text-zinc-400">({t.correct}/{t.answered})</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full rounded-full" style={{ width: `${t.pct}%`, backgroundColor: colour }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {notesList.length > 0 && (
            <button onClick={() => setShowNotesReview(true)} className="mt-8 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-400">
              📝 Review all notes ({notesList.length})
            </button>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/study" className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
              New session
            </Link>
            <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 text-lg font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }function startTimed() {
    setElapsed(0);
    setPaused(false);
    setDismissedTimeUp(false);
    setTimed(true);
  }
  function stopTimed() {
    setTimed(false);
    setPaused(false);
    setElapsed(0);
  }
  function chooseOption(letter: string) {
    if (!submitted) setPending(letter);
  }

  function onNoteChange(text: string) {
    const qid = q.id;
    setNotes((n) => ({ ...n, [qid]: text }));
    setNoteSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      await supabase.from("notes").upsert({
        user_id: userData.user.id,
        question_id: qid,
        content: text,
        updated_at: new Date().toISOString(),
      });
      setNoteSaved(true);
    }, 800);
  }

  async function loadStats(questionId: number) {
    const { data, error } = await supabase.rpc("question_correct_pct", { qid: questionId });
    if (error) {
      console.error("Error loading question stats:", error);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setStats((s) => ({
        ...s,
        [questionId]: { total: Number(row.total), correct: Number(row.correct) },
      }));
    }
  }

  async function submitAnswer() {
    if (!pending) return;
    const chosen = q.options.find((o) => o.letter === pending);
    const isCorrect = chosen ? chosen.correct : false;
    const updated = { ...answers, [index]: { selected: pending, correct: isCorrect } };
    setAnswers(updated);

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.from("answers").insert({
        user_id: userData.user.id,
        question_id: q.id,
        is_correct: isCorrect,
      });
      if (error) console.error("Error saving answer:", error);
    }

    await loadStats(q.id);

    if (Object.keys(updated).length === questions.length) {
      setFinalTime(elapsed);
      setFinished(true);
    }
  }

  async function flagQuestion() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert("Please log in to flag a question.");
      return;
    }
    const { error } = await supabase.from("flags").insert({
      user_id: userData.user.id,
      question_id: q.id,
    });
    if (error) console.error("Error flagging:", error);
    else setFlagged((f) => ({ ...f, [q.id]: true }));
  }

  function giveFeedback(kind: "up" | "down") {
    setFeedback((f) => ({ ...f, [q.id]: kind }));
  }

  function reportQuestion() {
    const code = refCode(q);
    const subject = encodeURIComponent("ALQB question report — " + code);
    const body = encodeURIComponent(
      "I'd like to report a problem with this question.\n\nQuestion code: " +
        code +
        "\nTopic: " +
        (q.topic || "") +
        "\n\nWhat's wrong:\n"
    );
    window.location.href = "mailto:" + REPORT_EMAIL + "?subject=" + subject + "&body=" + body;
  }

  function toggleExplain(letter: string) {
    const key = q.id + "-" + letter;
    setOpenExplain((o) => ({ ...o, [key]: !o[key] }));
  }

  function goToQuestion(i: number) {
    setIndex(i);
    setPending(null);
    setNoteSaved(false);
  }
  function nextQuestion() {
    if (index + 1 < questions.length) goToQuestion(index + 1);
    else endSession();
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 lg:flex-row">
      {showTimeUpPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p className="text-5xl">⏰</p>
            <h2 className="mt-4 text-2xl font-extrabold text-zinc-900">Time&apos;s up!</h2>
            <p className="mt-2 text-zinc-500">
              You&apos;ve answered {answeredCount} of {questions.length} questions. Keep going, or finish and see your results?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={() => setDismissedTimeUp(true)} className="rounded-full border-2 border-emerald-200 bg-white px-6 py-3 font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-400">
                Keep going
              </button>
              <button onClick={endSession} className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
                Finish now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
          {timed ? (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Elapsed</p>
                <p className="text-xl font-extrabold text-zinc-700">{fmt(elapsed)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPaused((p) => !p)} className={`rounded-full px-5 py-1.5 text-sm font-bold transition-colors ${paused ? "bg-emerald-700 text-white hover:bg-emerald-800" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button onClick={stopTimed} className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-50">
                  End timer
                </button>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{timeUp ? "Overtime" : paused ? "Paused" : "Remaining"}</p>
                <p className={`text-xl font-extrabold ${timeUp ? "text-amber-600" : remaining <= 60 ? "text-red-600" : "text-emerald-700"}`}>
                  {timeUp ? "+" + fmt(elapsed - totalTime) : fmt(remaining)}
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-500">Set a time limit:</p>
              <div className="flex items-center gap-2">
                {[10, 20, 30, 45, 60].map((m) => (
                  <button key={m} onClick={() => setMinutes(m)} className={`rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${minutes === m ? "bg-emerald-700 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                    {m}m
                  </button>
                ))}
                <button onClick={startTimed} className="ml-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800">
                  Start
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Question {index + 1} of {questions.length}</p>
          {showScore && answeredCount > 0 && (
            <p className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800">{correctCount}/{answeredCount} correct · {accuracy}%</p>
          )}
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            {q.topic ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                {q.topic}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={flagQuestion}
              disabled={isFlagged}
              title="Flag this question for review"
              className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${isFlagged ? "border-red-200 bg-red-50 text-red-500" : "border-zinc-200 text-zinc-400 hover:border-red-300 hover:text-red-500"}`}
            >
              {isFlagged ? "⚑ Flagged" : "⚑ Flag"}
            </button>
          </div>
          <h2 className="text-2xl font-bold leading-snug text-zinc-900">{q.stem}</h2>

          <div className="mt-6 flex flex-col gap-3">
            {q.options.map((option) => {
              const isActive = activeChoice === option.letter;
              const isPicked = submitted && thisAnswer.selected === option.letter;
              const revealOpen = openExplain[q.id + "-" + option.letter];
              let style = "border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50/50";
              if (submitted && option.correct) style = "border-emerald-500 bg-emerald-50";
              else if (submitted && isActive) style = "border-red-300 bg-red-50";
              else if (isActive) style = "border-emerald-500 bg-emerald-50";
              return (
                <div key={option.letter} className={`rounded-2xl border-2 px-5 py-4 text-lg transition-all ${style}`}>
                  <button onClick={() => chooseOption(option.letter)} className="w-full text-left" disabled={submitted}>
                    <span className="font-bold text-emerald-700">{option.letter}.</span> {option.text}
                  </button>
                  {submitted && (isPicked || option.correct) && <ExplanationText text={option.explanation} />}
                  {submitted && !isPicked && !option.correct && (
                    <div className="mt-2">
                      <button onClick={() => toggleExplain(option.letter)} className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                        {revealOpen ? "Hide explanation ▴" : "Show explanation ▾"}
                      </button>
                      {revealOpen && <ExplanationText text={option.explanation} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-5">
            <button onClick={endSession} className="rounded-full border-2 border-zinc-200 bg-white px-6 py-2.5 font-bold text-zinc-600 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
              Finish
            </button>
            {!submitted ? (
              <button onClick={submitAnswer} disabled={pending === null} className="rounded-full bg-emerald-700 px-10 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none">
                Submit Answer
              </button>
            ) : (
              <button onClick={nextQuestion} className="rounded-full bg-emerald-700 px-10 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
                {index + 1 < questions.length ? "Next Question →" : "Finish →"}
              </button>
            )}
          </div>

          {showTakeaway && (
            <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
              <p className="font-bold text-indigo-800">💡 Key takeaway</p>
              <TakeawayText text={q.key_takeaway || ""} />
            </div>
          )}

          {submitted && thisStats && (
            <p className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
              {thisStats.total <= 1
                ? "🌍 You're the first to answer this one!"
                : "🌍 " + Math.round((thisStats.correct / thisStats.total) * 100) + "% of students got this right (" + thisStats.total + " answers)"}
            </p>
          )}

          {submitted && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-zinc-500">Was this question helpful?</span>
              <button onClick={() => giveFeedback("up")} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${thisFeedback === "up" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500 hover:border-emerald-300"}`}>
                👍 Yes
              </button>
              <button onClick={() => giveFeedback("down")} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${thisFeedback === "down" ? "border-red-300 bg-red-50 text-red-600" : "border-zinc-200 text-zinc-500 hover:border-red-300"}`}>
                👎 No
              </button>
              <button onClick={reportQuestion} className="ml-auto rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-semibold text-zinc-500 transition-colors hover:border-amber-400 hover:text-amber-600">
                ⚠ Report
              </button>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-700">📝 My notes</p>
              {noteSaved && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
            </div>
            <textarea
              value={thisNote}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Jot down anything you want to remember about this question…"
              className="mt-2 h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-emerald-400"
            />
          </div>

          {showResources && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-800">📚 Further resources</p>
              <p className="mt-1 text-xs font-semibold text-amber-700/70">Notes and videos for this topic</p>
              <div className="mt-3 flex flex-col gap-2">
                {q.resources!.map((r, i) => (
                  <Link key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900">
                    {r.title} ↗
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <Comments questionId={q.id} canPost={submitted} />
      </div>

      <aside className="lg:w-60">
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <button
            onClick={() => setShowScore((s) => !s)}
            className="mb-4 w-full rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            {showScore ? "🙈 Hide score" : "👁 Show score"}
          </button>
          {showScore && answeredCount > 0 && (
            <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-emerald-800">
              {correctCount}/{answeredCount} · {accuracy}%
            </p>
          )}
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Questions</h3>
          <div className="mt-4 flex max-h-[55vh] flex-col gap-1.5 overflow-y-auto pr-1">
            {questions.map((qq, i) => {
              const a = answers[i];
              const isCurrent = i === index;
              const qFlagged = !!flagged[qq.id];
              const hasNote = (notes[qq.id] || "").trim().length > 0;
              let dot = "bg-zinc-200";
              if (a) dot = a.correct ? "bg-emerald-500" : "bg-red-400";
              return (
                <button key={i} onClick={() => goToQuestion(i)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${isCurrent ? "bg-emerald-50 font-bold text-emerald-800" : "text-zinc-600 hover:bg-zinc-50"}`}>
                  <span className="flex items-center gap-1.5">
                    Question {i + 1}
                    {qFlagged && <span className="text-red-500">⚑</span>}
                    {hasNote && <span className="text-emerald-600">📝</span>}
                  </span>
                  <span className={`h-3.5 w-3.5 rounded-full ${dot}`} />
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </main>
  );
}