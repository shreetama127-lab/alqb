"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const OWNER_EMAILS = ["shreetama127@gmail.com"];
const REPORT_EMAIL = "info.alqb@gmail.com";

const ADJECTIVES = [
  "Covalent", "Ionic", "Mitotic", "Meiotic", "Enzymatic", "Aerobic", "Anaerobic",
  "Hydrophilic", "Hydrophobic", "Catalytic", "Osmotic", "Polar", "Saturated",
  "Alkaline", "Buffered", "Helical", "Ribosomal", "Cytoplasmic", "Allosteric",
  "Exothermic", "Endothermic", "Photosynthetic", "Diploid", "Haploid", "Turgid",
];
const NOUNS = [
  "Otter", "Newt", "Axolotl", "Badger", "Ferret", "Heron", "Ibex", "Kestrel",
  "Lemur", "Marmot", "Narwhal", "Ocelot", "Puffin", "Quokka", "Raven", "Stoat",
  "Tapir", "Urchin", "Vole", "Walrus", "Yak", "Mitochondrion", "Ribosome",
  "Chloroplast", "Flagellum", "Enzyme", "Beaker", "Pipette",
];

type Row = {
  id: number;
  user_id: string;
  parent_id: number | null;
  content: string;
  deleted: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function randomHandle() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}${n}${Math.floor(Math.random() * 90) + 10}`;
}

export default function Comments({ questionId, canPost }: { questionId: number; canPost: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    load();
  }, [questionId]);

  async function load() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setUserId(userData.user.id);
      setIsOwner(OWNER_EMAILS.includes(userData.user.email || ""));
    }

    const { data } = await supabase
      .from("comments")
      .select("id, user_id, parent_id, content, deleted, created_at")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true });

    const list = (data || []) as Row[];
    setRows(list);

    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length > 0) {
      const { data: hs } = await supabase
        .from("user_handles")
        .select("user_id, handle")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (hs || []).forEach((h) => {
        map[h.user_id] = h.handle;
      });
      setHandles(map);
    }
    setLoading(false);
  }

  async function ensureHandle(uid: string): Promise<string> {
    const { data: existing } = await supabase
      .from("user_handles")
      .select("handle")
      .eq("user_id", uid)
      .maybeSingle();
    if (existing?.handle) return existing.handle;

    for (let i = 0; i < 6; i++) {
      const candidate = randomHandle();
      const { error } = await supabase
        .from("user_handles")
        .insert({ user_id: uid, handle: candidate });
      if (!error) return candidate;
    }
    return "Anonymous";
  }

  async function post(content: string, parentId: number | null) {
    const body = content.trim();
    if (!body || !userId) return;
    setPosting(true);
    await ensureHandle(userId);
    const { error } = await supabase.from("comments").insert({
      question_id: questionId,
      user_id: userId,
      parent_id: parentId,
      content: body,
    });
    if (error) console.error("Error posting comment:", error);
    setText("");
    setReplyText("");
    setReplyTo(null);
    setPosting(false);
    await load();
  }

  async function removeComment(id: number) {
    if (!confirm("Remove this comment?")) return;
    const { error } = await supabase.from("comments").update({ deleted: true }).eq("id", id);
    if (error) console.error("Error removing comment:", error);
    await load();
  }

  function reportComment(c: Row) {
    const subject = encodeURIComponent("ALQB comment report — comment #" + c.id);
    const body = encodeURIComponent(
      "I'd like to report a comment.\n\nComment ID: " + c.id +
      "\nQuestion ID: " + questionId +
      "\n\nWhy:\n"
    );
    window.location.href = "mailto:" + REPORT_EMAIL + "?subject=" + subject + "&body=" + body;
  }

  const topLevel = rows.filter((r) => r.parent_id === null);
  const repliesOf = (id: number) => rows.filter((r) => r.parent_id === id);
  const visibleCount = rows.filter((r) => !r.deleted).length;

  function Bubble({ c, isReply }: { c: Row; isReply: boolean }) {
    const mine = c.user_id === userId;
    return (
      <div className={`rounded-2xl border p-4 ${isReply ? "border-zinc-100 bg-zinc-50/60" : "border-emerald-100 bg-white"}`}>
        {c.deleted ? (
          <p className="text-sm italic text-zinc-400">This comment was removed.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-emerald-700">{handles[c.user_id] || "Anonymous"}</span>
              {mine && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">You</span>}
              <span className="text-xs text-zinc-400">{timeAgo(c.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{c.content}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
              {!isReply && canPost && (
                <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }} className="text-emerald-700 hover:underline">
                  Reply
                </button>
              )}
              {(mine || isOwner) && (
                <button onClick={() => removeComment(c.id)} className="text-zinc-400 hover:text-red-500">
                  {isOwner && !mine ? "Remove (admin)" : "Delete"}
                </button>
              )}
              {!mine && (
                <button onClick={() => reportComment(c)} className="ml-auto text-zinc-400 hover:text-amber-600">
                  ⚠ Report
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900">💬 Discussion</h3>
        <span className="text-sm font-semibold text-zinc-400">
          {visibleCount} comment{visibleCount === 1 ? "" : "s"}
        </span>
      </div>

      {!canPost && (
        <p className="mt-3 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          Answer this question to join the discussion.
        </p>
      )}

      {canPost && (
        <div className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question or share how you worked it out…"
            className="h-24 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-emerald-400"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Posted under your anonymous name. Be kind and keep it about the biology.</p>
            <button
              onClick={() => post(text, null)}
              disabled={posting || !text.trim()}
              className="shrink-0 rounded-full bg-emerald-700 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:bg-zinc-300"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-zinc-400">Loading comments…</p>
      ) : topLevel.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-400">No comments yet — be the first.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {topLevel.map((c) => (
            <div key={c.id}>
              <Bubble c={c} isReply={false} />
              {repliesOf(c.id).length > 0 && (
                <div className="ml-6 mt-2 flex flex-col gap-2 border-l-2 border-emerald-100 pl-4">
                  {repliesOf(c.id).map((r) => (
                    <Bubble key={r.id} c={r} isReply={true} />
                  ))}
                </div>
              )}
              {replyTo === c.id && (
                <div className="ml-6 mt-2 border-l-2 border-emerald-100 pl-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Replying to ${handles[c.user_id] || "Anonymous"}…`}
                    className="h-20 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-emerald-400"
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => post(replyText, c.id)} disabled={posting || !replyText.trim()} className="rounded-full bg-emerald-700 px-5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:bg-zinc-300">
                      Reply
                    </button>
                    <button onClick={() => setReplyTo(null)} className="rounded-full border border-zinc-200 px-5 py-1.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}