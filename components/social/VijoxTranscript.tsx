"use client";

import { useMemo, useState } from "react";

export type VijoxTranscriptSegment = { startMs: number; endMs: number; text: string };
export type VijoxTranscriptData = { text: string; segments?: VijoxTranscriptSegment[] };

export default function VijoxTranscript({ transcript, currentSeconds }: { transcript?: VijoxTranscriptData | null; currentSeconds: number }) {
  const [open, setOpen] = useState(false);
  const active = useMemo(() => transcript?.segments?.findIndex(segment => currentSeconds * 1000 >= segment.startMs && currentSeconds * 1000 < segment.endMs) ?? -1, [currentSeconds, transcript]);
  if (!transcript?.text.trim()) return null;
  const timed = transcript.segments?.length;
  return <div className="mt-3 border-t border-violet-100 pt-3">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="text-caption font-bold text-brand-indigo">{open ? "Hide transcript" : "CC / Transcript"}</button>
    {open && <div className="mt-2 max-h-28 overflow-y-auto pr-1 text-body-sm leading-6 text-brand-slate" aria-live="polite">
      {timed ? transcript.segments!.map((segment, index) => <span key={`${segment.startMs}-${index}`} className={`mr-1 inline transition-all motion-reduce:transition-none ${index === active ? "rounded bg-violet-100 px-1 font-bold text-violet-800 shadow-[0_0_12px_rgba(139,92,246,.18)]" : index > active && active >= 0 ? "text-brand-slate/60" : "text-brand-slate"}`}>{segment.text}</span>) : transcript.text}
    </div>}
  </div>;
}
