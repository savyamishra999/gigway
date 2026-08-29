"use client";
import { useEffect, useRef, useState } from "react";
import type { VijoxTimedReactionSummary, VijoxTimedReactionType } from "@/lib/social/vijox-timed-reactions";
const emoji: Record<VijoxTimedReactionType, string> = { love: "❤️", applause: "👏", insight: "💡", fire: "🔥" };
export default function VijoxReactionMoments({ summary, currentTimeMs }: { summary: VijoxTimedReactionSummary | null; currentTimeMs: number; durationMs: number }) {
  const [liveMoment, setLiveMoment] = useState<VijoxTimedReactionSummary["moments"][number] | null>(null);
  const last = useRef<number | null>(null), timeout = useRef<ReturnType<typeof setTimeout> | null>(null), bucket = Math.floor(currentTimeMs / 500) * 500, active = summary?.moments.find(moment => moment.timestampMs === bucket) || null;
  useEffect(() => { if (!active) { last.current = null; return; } if (last.current === active.timestampMs) return; last.current = active.timestampMs; setLiveMoment(active); if (timeout.current) clearTimeout(timeout.current); timeout.current = setTimeout(() => setLiveMoment(null), 1250); }, [active]);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  if (!liveMoment) return null;
  return <div aria-hidden className="pointer-events-none mx-auto mt-3 flex w-fit max-w-full gap-1 rounded-full border border-violet-200 bg-white/95 px-2 py-0.5 text-[11px] font-bold text-violet-800 shadow-sm motion-safe:animate-pulse">{Object.entries(liveMoment.counts).filter(([, count]) => !!count).sort(([, a], [, b]) => (b || 0) - (a || 0)).slice(0, 2).map(([type, count]) => <span key={type}>{emoji[type as VijoxTimedReactionType]} {count}</span>)}</div>;
}
