"use client";

import { Pause, Play } from "lucide-react";
import { useId, useRef, type PointerEvent, type ReactNode } from "react";
import type { VijoxTimedReactionSummary } from "@/lib/social/vijox-timed-reactions";

const SIZE = 184, RADIUS = 78, CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function VijoxCircularProgress({ currentTimeMs, durationMs, energy = 0, summary, playing, onToggle, onSeek, onSeekStart, onSeekEnd, center, label }: { currentTimeMs: number; durationMs: number; energy?: number; summary?: VijoxTimedReactionSummary | null; playing?: boolean; onToggle?: () => void; onSeek?: (timeMs: number) => void; onSeekStart?: () => void; onSeekEnd?: () => void; center?: ReactNode; label: string }) {
  const progress = Math.max(0, Math.min(1, currentTimeMs / Math.max(1, durationMs))), offset = CIRCUMFERENCE * (1 - progress);
  const gradientId = useId().replace(/:/g, "");
  const scrubbing = useRef<number | null>(null);
  const point = (fraction: number, radius = 88) => { const angle = fraction * Math.PI * 2 - Math.PI / 2; return { x: SIZE / 2 + Math.cos(angle) * radius, y: SIZE / 2 + Math.sin(angle) * radius }; };
  const leading = point(progress), activeBucket = Math.floor(currentTimeMs / 500) * 500;
  const angleForPointer = (event: PointerEvent<SVGCircleElement>) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return null;
    const x = (event.clientX - rect.left) * SIZE / rect.width - SIZE / 2, y = (event.clientY - rect.top) * SIZE / rect.height - SIZE / 2;
    return Math.atan2(y, x);
  };
  const seekToAngle = (event: PointerEvent<SVGCircleElement>) => {
    if (!onSeek || !Number.isFinite(durationMs) || durationMs <= 0) return;
    const angle = angleForPointer(event); if (angle === null) return;
    const fraction = ((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    onSeek(fraction * durationMs);
  };
  const startScrub = (event: PointerEvent<SVGCircleElement>) => { if (!onSeek || !Number.isFinite(durationMs) || durationMs <= 0) return; event.preventDefault(); scrubbing.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); onSeekStart?.(); seekToAngle(event); };
  const moveScrub = (event: PointerEvent<SVGCircleElement>) => { if (scrubbing.current !== event.pointerId) return; event.preventDefault(); seekToAngle(event); };
  const endScrub = (event: PointerEvent<SVGCircleElement>) => { if (scrubbing.current !== event.pointerId) return; scrubbing.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); onSeekEnd?.(); };
  return <div className="relative mx-auto h-[min(58vw,220px)] w-[min(58vw,220px)] min-h-[175px] min-w-[175px] max-h-[220px] max-w-[220px]">
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible" role="img" aria-label={label}>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ec4899"/><stop offset=".38" stopColor="#8b5cf6"/><stop offset=".7" stopColor="#4f46e5"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#ede9fe" strokeWidth="7"/>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={`url(#${gradientId})`} strokeWidth="7" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} className="motion-reduce:transition-none"/>
      {onSeek && <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="transparent" strokeWidth="30" className="cursor-pointer touch-none" onPointerDown={startScrub} onPointerMove={moveScrub} onPointerUp={endScrub} onPointerCancel={endScrub} aria-label="Seek Jox playback"/>}
      <circle cx={SIZE / 2} cy={SIZE / 2} r="63" fill="none" stroke="#c4b5fd" strokeWidth="1.5" opacity={.25 + energy * .35}/>
      {summary?.moments.map(moment => { const fraction = Math.max(0, Math.min(1, moment.timestampMs / Math.max(1, durationMs))), dot = point(fraction), active = moment.timestampMs === activeBucket, strength = Math.min(1, moment.total / 6), radius = active ? 4.8 : 2.6 + strength; return <g key={moment.timestampMs} className="pointer-events-none"><circle cx={dot.x} cy={dot.y} r={radius + 2} fill="#a78bfa" opacity={active ? .35 : .12 + strength * .14}/><circle cx={dot.x} cy={dot.y} r={radius} fill="#6d28d9" stroke="white" strokeWidth="1.5" opacity={.58 + strength * .38}/></g>; })}
      <circle cx={leading.x} cy={leading.y} r="7" fill="#c4b5fd" opacity=".34"/><circle cx={leading.x} cy={leading.y} r="3.8" fill="#fff" stroke="#8b5cf6" strokeWidth="2" className="motion-reduce:transition-none"/>
    </svg>
    <div className="absolute inset-[18px] grid place-items-center rounded-full bg-gradient-to-br from-white via-violet-50/65 to-cyan-50/70 shadow-[inset_0_0_0_1px_rgba(139,92,246,.14),0_10px_28px_rgba(124,58,237,.13)] motion-reduce:transform-none" style={{ transform: `scale(${1 + energy * .055})` }}>
      {center}
      {onToggle && <button type="button" onClick={onToggle} aria-label={playing ? "Pause VIJOX" : "Play VIJOX"} className="absolute inset-0 grid place-items-center rounded-full bg-violet-950/0 text-white transition hover:bg-violet-950/10"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand-indigo/90 shadow-sm">{playing ? <Pause className="h-4 w-4"/> : <Play className="ml-0.5 h-4 w-4"/>}</span></button>}
    </div>
  </div>;
}
