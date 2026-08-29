"use client";

import { useEffect, useRef, useState } from "react";
import type { VijoxTimedReactionSummary, VijoxTimedReactionType } from "@/lib/social/vijox-timed-reactions";

const emoji: Record<VijoxTimedReactionType, string> = { love: "❤️", applause: "👏", insight: "💡", fire: "🔥" };

export default function VijoxReactionMoments({ summary, currentTimeMs, durationMs }: { summary: VijoxTimedReactionSummary | null; currentTimeMs: number; durationMs: number }) {
  const [liveMoment, setLiveMoment] = useState<VijoxTimedReactionSummary["moments"][number] | null>(null);
  const lastSurfaced = useRef<number | null>(null), timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bucket = Math.floor(currentTimeMs / 500) * 500;
  const activeMoment = summary?.moments.find(moment => moment.timestampMs === bucket) || null;
  useEffect(() => {
    if (!activeMoment) { lastSurfaced.current = null; return; }
    if (lastSurfaced.current === activeMoment.timestampMs) return;
    lastSurfaced.current = activeMoment.timestampMs;
    setLiveMoment(activeMoment);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setLiveMoment(null), 1250);
  }, [activeMoment]);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  if (!summary?.total || !durationMs) return null;
  const duration = Math.max(1, durationMs);
  return <div className="relative mt-3" aria-hidden="true">
    <div className="relative h-1.5 overflow-visible rounded-full bg-violet-100">
      <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-400 via-violet-500 to-cyan-400" style={{ width: `${Math.max(0, Math.min(100, currentTimeMs / duration * 100))}%` }} />
      <span className="pointer-events-none absolute inset-0">
        {summary.moments.map(moment => {
          const position = Math.max(0, Math.min(100, moment.timestampMs / duration * 100));
          const active = moment.timestampMs === bucket;
          const strength = Math.min(1, moment.total / 6);
          return <i key={moment.timestampMs} className={`absolute top-1/2 rounded-full bg-violet-700 ring-2 ring-white/90 ${active ? "h-2.5 w-2.5 -translate-y-1/2 shadow-[0_0_0_3px_rgba(139,92,246,.20)]" : "h-1.5 w-1.5 -translate-y-1/2"}`} style={{ left: `${position}%`, opacity: .42 + strength * .48, transform: "translate(-50%, -50%)" }} />;
        })}
      </span>
    </div>
    {liveMoment && <div className="pointer-events-none absolute -top-8 left-1/2 z-10 flex max-w-[calc(100%-8px)] -translate-x-1/2 gap-1 rounded-full border border-violet-200 bg-white/95 px-2 py-0.5 text-[11px] font-bold text-violet-800 shadow-sm motion-safe:animate-pulse">
      {Object.entries(liveMoment.counts).filter(([, count]) => !!count).sort(([, a], [, b]) => (b || 0) - (a || 0)).slice(0, 2).map(([type, count]) => <span key={type}>{emoji[type as VijoxTimedReactionType]} {count}</span>)}
    </div>}
  </div>;
}
