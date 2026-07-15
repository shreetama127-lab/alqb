"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Option = { letter: string; text: string; correct: boolean; explanation: string };
type Resource = { title: string; url: string };
type Question = {
  id: number;
  stem: string;
  topic?: string;
  options: Option[];
  resources?: Resource[] | null;
};
type AnswerRecord = Record<number, { selected: string; correct: boolean }>;

const REPORT_EMAIL = "info.alqb@gmail.com";

function fmt(total: number) {
  const m = Math.floor(Math.abs(total) / 60);
  const s = Math.abs(total) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Split explanation text on blank lines so it renders as readable paragraphs.
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

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function prepareQuestions(data: Question[]): Question[] {
  return shuffle(data).map((q) => ({
    ...q,
    options: shuffle(q.options).map((opt, i) => ({
      ...opt,
      letter: LETTERS[i] || opt.letter,
    })),
  }));
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
  const [finished, setFinished] = useState(false);
  const [finalTime, setFinalTime] = useState(0);

  useEffect(() => {
    async function loadQuestions() {
      const params = new URLSearchParams(window.location.search);
      const topicsParam = params.get("topics");
      const chosenTopics = topicsParam ? topicsParam.split("~~") : [];
      const modulesParam = params.get("modules");
      const chosenModules = modulesParam ? modulesParam.split("~~") : [];
      const difficulty = params.get("difficulty");

      let query = supabase.from("questions").select("id, stem, topic, options, resources");
      if (chosenTopics.length > 0) query = query.in("topic", chosenTopics);
      if (chosenModules.length > 0) query = query.in("module", chosenModules);
      if (difficulty && difficulty !== "All") query = query.eq("difficulty", difficulty);

      const { data, error } = await query;
      if (error) console.error("Error loading questions:", error);
      else if (data) setQuestions(prepareQuestions(data as Question[]));
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
  const showResources = submitted && q.resources && q.resources.length > 0;

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const totalTime = minutes * 60;
  const remaining = totalTime - elapsed;
  const timeUp = timed && remaining <= 0;
  const showTimeUpPopup = timeUp && !dismissedTimeUp && !finished;

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

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setFinished(false);
                setIndex(0);
                setAnswers({});
                setPending(null);
                setElapsed(0);
                setTimed(false);
                setPaused(false);
                setDismissedTimeUp(false);
                setFinalTime(0);
                setOpenExplain({});
                setQuestions((qs) => prepareQuestions(qs));
              }}
              className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Study again
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 text-lg font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300"
            >
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
    const subject = encodeURIComponent("ALQB question report — Question #" + q.id);
    const body = encodeURIComponent(
      "I'd like to report a problem with this question.\n\nQuestion ID: " +
        q.id +
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
              <button
                onClick={() => setDismissedTimeUp(true)}
                className="rounded-full border-2 border-emerald-200 bg-white px-6 py-3 font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-400"
              >
                Keep going
              </button>
              <button
                onClick={endSession}
                className="rounded-full bg-emerald-700 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
              >
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
          {answeredCount > 0 && (
            <p className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800">{correctCount}/{answeredCount} correct · {accuracy}%</p>
          )}
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          {q.topic && (
            <span className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              {q.topic}
            </span>
          )}
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

          {showResources && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-800">📚 Further resources</p>
              <p className="mt-1 text-xs font-semibold text-amber-700/70">Notes and videos for this topic</p>
              <div className="mt-3 flex flex-col gap-2">
                {q.resources!.map((r, i) => (
                  <Link
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
                  >
                    {r.title} ↗
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900">💬 Discussion</h3>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
              Coming soon
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Soon you&apos;ll be able to discuss this question with other students — ask for help, share tips, and explain tricky concepts.
          </p>
          <div className="mt-4 cursor-not-allowed rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400">
            Write a comment… (coming soon)
          </div>
        </div>
      </div>

      <aside className="lg:w-60">
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <button onClick={flagQuestion} disabled={isFlagged} className={`mb-4 w-full rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${isFlagged ? "border-red-200 bg-red-50 text-red-500" : "border-zinc-200 text-zinc-500 hover:border-red-300 hover:text-red-500"}`}>
            {isFlagged ? "⚑ Flagged" : "⚑ Flag this question"}
          </button>
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Questions</h3>
          <div className="mt-4 flex max-h-[55vh] flex-col gap-1.5 overflow-y-auto pr-1">
            {questions.map((qq, i) => {
              const a = answers[i];
              const isCurrent = i === index;
              const qFlagged = !!flagged[qq.id];
              let dot = "bg-zinc-200";
              if (a) dot = a.correct ? "bg-emerald-500" : "bg-red-400";
              return (
                <button key={i} onClick={() => goToQuestion(i)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${isCurrent ? "bg-emerald-50 font-bold text-emerald-800" : "text-zinc-600 hover:bg-zinc-50"}`}>
                  <span className="flex items-center gap-1.5">
                    Question {i + 1}
                    {qFlagged && <span className="text-red-500">⚑</span>}
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