"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Option = { letter: string; text: string; correct: boolean; explanation: string };
type Question = { id: number; stem: string; topic?: string; options: Option[] };
type AnswerRecord = Record<number, { selected: string; correct: boolean }>;

function fmt(total: number) {
  const m = Math.floor(Math.abs(total) / 60);
  const s = Math.abs(total) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuestionPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [pending, setPending] = useState<string | null>(null);
  const [timed, setTimed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      const params = new URLSearchParams(window.location.search);
      const topicsParam = params.get("topics");
      const chosenTopics = topicsParam ? topicsParam.split("~~") : [];

      let query = supabase.from("questions").select("id, stem, topic, options").order("id");
      if (chosenTopics.length > 0) {
        query = supabase
          .from("questions")
          .select("id, stem, topic, options")
          .in("topic", chosenTopics)
          .order("id");
      }

      const { data, error } = await query;
      if (error) console.error("Error loading questions:", error);
      else if (data) setQuestions(data as Question[]);
      setLoading(false);
    }
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timed]);

  if (loading)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading questions…</p>
      </main>
    );

  if (questions.length === 0)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6">
        <p className="text-zinc-400">No questions found for these topics.</p>
      </main>
    );

  const q = questions[index];
  const thisAnswer = answers[index];
  const submitted = !!thisAnswer;
  const activeChoice = submitted ? thisAnswer.selected : pending;
  const isFlagged = !!flagged[q.id];

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const totalTime = minutes * 60;
  const remaining = totalTime - elapsed;
  const timeUp = timed && remaining <= 0;

  // ---- Summary screen ----
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
    const best = topicList.length ? topicList[topicList.length - 1] : null;
    const worst = topicList.length ? topicList[0] : null;

    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
          <p className="text-5xl">{accuracy >= 70 ? "🎉" : accuracy >= 40 ? "💪" : "📚"}</p>
          <h1 className="mt-4 text-3xl font-extrabold text-zinc-900">Session complete!</h1>
          <p className="mt-2 text-zinc-500">Here&apos;s how you did.</p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex-1 rounded-2xl bg-emerald-50 p-5">
              <p className="text-4xl font-extrabold text-emerald-700">{correctCount}</p>
              <p className="text-sm font-semibold text-emerald-700/70">Correct</p>
            </div>
            <div className="flex-1 rounded-2xl bg-zinc-50 p-5">
              <p className="text-4xl font-extrabold text-zinc-700">{answeredCount}</p>
              <p className="text-sm font-semibold text-zinc-500">Answered</p>
            </div>
            <div className="flex-1 rounded-2xl bg-emerald-50 p-5">
              <p className="text-4xl font-extrabold text-emerald-700">{accuracy}%</p>
              <p className="text-sm font-semibold text-emerald-700/70">Accuracy</p>
            </div>
          </div>

          {best && worst && answeredCount > 0 && (
            <div className="mt-6 flex flex-col gap-2 text-sm">
              {best.topic !== worst.topic && (
                <p className="text-zinc-600">
                  Strongest: <span className="font-bold text-emerald-700">{best.topic}</span> ({best.pct}%)
                </p>
              )}
              <p className="text-zinc-600">
                Focus next on: <span className="font-bold text-amber-600">{worst.topic}</span> ({worst.pct}%)
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setFinished(false);
                setIndex(0);
                setAnswers({});
                setPending(null);
                setElapsed(0);
                setTimed(false);
              }}
              className="rounded-full bg-emerald-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Study again
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 text-lg font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300"
            >
              View progress
            </Link>
          </div>
        </div>
      </main>
    );
  }

  function startTimed() {
    setElapsed(0);
    setTimed(true);
  }
  function stopTimed() {
    setTimed(false);
    setElapsed(0);
  }
  function chooseOption(letter: string) {
    if (!submitted) setPending(letter);
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

    // auto-finish if this was the last unanswered question
    if (Object.keys(updated).length === questions.length) {
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

  function goToQuestion(i: number) {
    setIndex(i);
    setPending(null);
  }
  function nextQuestion() {
    if (index + 1 < questions.length) goToQuestion(index + 1);
    else setFinished(true);
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 lg:flex-row">
      <div className="flex-1">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
          {timed ? (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Elapsed</p>
                <p className="text-xl font-extrabold text-zinc-700">{fmt(elapsed)}</p>
              </div>
              <button onClick={stopTimed} className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-50">
                End timer
              </button>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{timeUp ? "Time's up" : "Remaining"}</p>
                <p className={`text-xl font-extrabold ${remaining <= 60 ? "text-red-600" : "text-emerald-700"}`}>{timeUp ? "0:00" : fmt(remaining)}</p>
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
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold leading-snug text-zinc-900">{q.stem}</h2>
            <button onClick={flagQuestion} disabled={isFlagged} title="Flag this question for review" className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${isFlagged ? "border-red-200 bg-red-50 text-red-500" : "border-zinc-200 text-zinc-400 hover:border-red-300 hover:text-red-500"}`}>
              {isFlagged ? "⚑ Flagged" : "⚑ Flag"}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {q.options.map((option) => {
              const isActive = activeChoice === option.letter;
              let style = "border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50/50";
              if (submitted && option.correct) style = "border-emerald-500 bg-emerald-50";
              else if (submitted && isActive) style = "border-red-300 bg-red-50";
              else if (isActive) style = "border-emerald-500 bg-emerald-50";
              return (
                <button key={option.letter} onClick={() => chooseOption(option.letter)} className={`rounded-2xl border-2 px-5 py-4 text-left text-lg transition-all ${style}`}>
                  <span className="font-bold text-emerald-700">{option.letter}.</span> {option.text}
                  {submitted && <p className="mt-2 text-sm text-zinc-600">{option.explanation}</p>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => setFinished(true)} className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-600 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
            Finish session
          </button>
          {!submitted ? (
            <button onClick={submitAnswer} disabled={pending === null} className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none">
              Submit Answer
            </button>
          ) : (
            <button onClick={nextQuestion} className="rounded-full bg-emerald-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800">
              {index + 1 < questions.length ? "Next Question →" : "Finish →"}
            </button>
          )}
        </div>
      </div>

      <aside className="lg:w-60">
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Questions</h3>
          <div className="mt-4 flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto pr-1">
            {questions.map((_, i) => {
              const a = answers[i];
              const isCurrent = i === index;
              let dot = "bg-zinc-200";
              if (a) dot = a.correct ? "bg-emerald-500" : "bg-red-400";
              return (
                <button key={i} onClick={() => goToQuestion(i)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${isCurrent ? "bg-emerald-50 font-bold text-emerald-800" : "text-zinc-600 hover:bg-zinc-50"}`}>
                  <span>Question {i + 1}</span>
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