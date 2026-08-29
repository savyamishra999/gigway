"use client";

import { useEffect, useRef, useState } from "react";
import type { VijoxTimedReactionSummary, VijoxTimedReactionType } from "@/lib/social/vijox-timed-reactions";

type Type = VijoxTimedReactionType;
const choices: [Type, string, string][] = [["love", "❤️", "Love"], ["applause", "👏", "Applause"], ["insight", "💡", "Insight"], ["fire", "🔥", "Fire"]];

export default function VijoxTimedReactions({ postId, currentTimeMs, summary, onSummaryChange, onLoad }: { postId: string; currentTimeMs: () => number; summary: VijoxTimedReactionSummary | null; onSummaryChange: (summary: VijoxTimedReactionSummary) => void; onLoad?: () => void }) {
  const [error, setError] = useState(""), [feedback, setFeedback] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  const load = async () => { if (summary) return summary; const r = await fetch(`/api/social/posts/${postId}/vijox-reactions`), d = await r.json(); if (!r.ok) throw Error(d.error || "Could not load reactions."); onSummaryChange(d); onLoad?.(); return d as VijoxTimedReactionSummary; };
  const react = async (type: Type) => {
    setError(""); let data: VijoxTimedReactionSummary;
    try { data = await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not load reactions."); return; }
    const ms = currentTimeMs(), bucket = Math.floor(ms / 500) * 500, active = data.viewerReactions.some(x => x.reactionType === type && x.timestampMs === bucket);
    const moment = data.moments.find(item => item.timestampMs === bucket);
    const next: VijoxTimedReactionSummary = { ...data, counts: { ...data.counts }, moments: data.moments.map(item => item.timestampMs === bucket ? { ...item, counts: { ...item.counts, [type]: Math.max(0, (item.counts[type] || 0) + (active ? -1 : 1)) }, total: item.total + (active ? -1 : 1) } : item), viewerReactions: active ? data.viewerReactions.filter(x => !(x.reactionType === type && x.timestampMs === bucket)) : [...data.viewerReactions, { reactionType: type, timestampMs: bucket }] };
    if (!moment && !active) next.moments = [...next.moments, { timestampMs: bucket, counts: { [type]: 1 }, total: 1 }].sort((a, b) => a.timestampMs - b.timestampMs);
    if (active && moment?.total === 1) next.moments = next.moments.filter(item => item.timestampMs !== bucket);
    next.total += active ? -1 : 1; next.mostReactedMoment = next.moments.reduce<{ timestampMs: number; total: number } | null>((best, item) => !best || item.total > best.total ? { timestampMs: item.timestampMs, total: item.total } : best, null);
    onSummaryChange(next);
    if (!active) { setFeedback(choices.find(choice => choice[0] === type)?.[1] || null); if (timeout.current) clearTimeout(timeout.current); timeout.current = setTimeout(() => setFeedback(null), 1200); }
    try { const r = await fetch(`/api/social/posts/${postId}/vijox-reactions`, { method: active ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reactionType: type, timestampMs: ms }) }), d = await r.json(); if (r.status === 401) { onSummaryChange(data); window.location.assign(`/login?next=${encodeURIComponent(location.pathname)}`); return; } if (!r.ok) throw Error(d.error || "Could not save reaction."); } catch (e) { onSummaryChange(data); setError(e instanceof Error ? e.message : "Could not save reaction."); }
  };
  const bucket = Math.floor(currentTimeMs() / 500) * 500;
  return <div className="relative mt-3 border-t border-violet-100 pt-3"><div className="flex flex-wrap gap-2">{choices.map(([type, emoji, label]) => { const active = !!summary?.viewerReactions.some(x => x.reactionType === type && x.timestampMs === bucket); return <button key={type} type="button" onClick={() => react(type)} aria-label={`React ${label} at current moment`} aria-pressed={active} className={`grid h-9 w-9 place-items-center rounded-full border text-base transition motion-reduce:transition-none ${active ? "border-violet-400 bg-violet-100 scale-110" : "border-violet-100 bg-white hover:bg-violet-50"}`}>{emoji}</button>; })}</div>{feedback && <span aria-hidden className="pointer-events-none absolute right-1 top-0 text-xl motion-safe:animate-pulse">{feedback}</span>}{summary && <p className="mt-2 text-caption text-brand-slate">{choices.map(([type, emoji]) => summary.counts[type] ? `${emoji} ${summary.counts[type]}` : null).filter(Boolean).join("  ") || "No reactions yet"}{summary.mostReactedMoment ? ` · Most reacted: 00:${Math.floor(summary.mostReactedMoment.timestampMs / 1000).toString().padStart(2, "0")}` : ""}</p>}{error && <p className="mt-2 text-caption text-brand-coral">{error}</p>}</div>;
}
