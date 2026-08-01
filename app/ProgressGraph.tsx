"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Point = { date: string; pct: number; count: number };

export default function ProgressGraph() {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setLoading(false); return; }

      const since = new Date();
      since.setDate(since.getDate() - 120);
      const { data } = await supabase
        .from("answers")
        .select("is_correct, created_at")
        .eq("user_id", userData.user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      const byDay: Record<string, { correct: number; total: number }> = {};
      (data || []).forEach((a) => {
        const day = new Date(a.created_at).toISOString().slice(0, 10);
        if (!byDay[day]) byDay[day] = { correct: 0, total: 0 };
        byDay[day].total += 1;
        if (a.is_correct) byDay[day].correct += 1;
      });

      const pts = Object.entries(byDay)
        .map(([date, v]) => ({ date, pct: Math.round((v.correct / v.total) * 100), count: v.total }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setPoints(pts);
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm"><p className="text-sm text-zinc-400">Loading progress…</p></div>;

  if (points.length < 2)
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-extrabold text-zinc-900">📈 Accuracy over time</h2>
        <p className="mt-3 text-sm text-zinc-500">Answer questions on at least two different days and your accuracy trend will appear here.</p>
      </div>
    );

  const W = 640;
  const H = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const n = points.length;
  const x = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (pct: number) => padT + (1 - pct / 100) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.pct).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const labelEvery = Math.ceil(n / 6);

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-zinc-900">📈 Accuracy over time</h2>
        <span className="text-sm font-semibold text-zinc-500">OCR A-Level Biology</span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" style={{ height: "auto" }}>
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{g}%</text>
            </g>
          ))}

          <path d={areaPath} fill="#d1fae5" opacity="0.5" />
          <path d={linePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
            <g key={p.date}>
              <circle cx={x(i)} cy={y(p.pct)} r="4" fill="#059669" />
              <title>{`${p.date}: ${p.pct}% (${p.count} answered)`}</title>
            </g>
          ))}

          {points.map((p, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text key={p.date} x={x(i)} y={H - 12} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {new Date(p.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </text>
            ) : null
          )}
        </svg>
      </div>

      <p className="mt-2 text-xs text-zinc-400">Each point is your accuracy for that day. Hover a point for details.</p>
    </div>
  );
}