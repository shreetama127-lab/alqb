"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type DayCount = { day: string; total: number };

function shade(count: number, max: number) {
  if (count <= 0) return "#eef2ff";
  const t = Math.min(count / Math.max(max, 1), 1);
  if (t < 0.25) return "#c7d2fe";
  if (t < 0.5) return "#a5b4fc";
  if (t < 0.75) return "#818cf8";
  return "#6366f1";
}

export default function Heatmap() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("daily_answer_counts", { days_back: 119 });
      if (!error && data) {
        const map: Record<string, number> = {};
        let sum = 0;
        (data as DayCount[]).forEach((d) => {
          map[d.day] = Number(d.total);
          sum += Number(d.total);
        });
        setCounts(map);
        setTotal(sum);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"><p className="text-sm text-zinc-400">Loading activity…</p></div>;

  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 119);
  start.setDate(start.getDate() - start.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const max = Math.max(1, ...Object.values(counts));
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">📅 Activity</h2>
        <span className="text-sm font-semibold text-zinc-400">{total} answered in the last 4 months</span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                const key = day.toISOString().slice(0, 10);
                const c = counts[key] || 0;
                const future = day > today;
                return (
                  <div
                    key={di}
                    title={future ? "" : `${key}: ${c} answered`}
                    className="h-3 w-3 rounded-[3px]"
                    style={{ backgroundColor: future ? "transparent" : shade(c, max) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-zinc-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: "#eef2ff" }} />
        <div className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: "#c7d2fe" }} />
        <div className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: "#a5b4fc" }} />
        <div className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: "#818cf8" }} />
        <div className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: "#6366f1" }} />
        <span>More</span>
      </div>
    </div>
  );
}