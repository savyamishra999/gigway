"use client";

import { useEffect, useRef, useState } from "react";
import { announceMediaPlay, MEDIA_PLAY_EVENT } from "@/lib/social/media-playback";
import VijoxTranscript, { type VijoxTranscriptData } from "@/components/social/VijoxTranscript";
import VijoxTimedReactions from "@/components/social/VijoxTimedReactions";
import VijoxReactionMoments from "@/components/social/VijoxReactionMoments";
import VijoxCircularProgress from "@/components/social/VijoxCircularProgress";
import type { VijoxTimedReactionSummary } from "@/lib/social/vijox-timed-reactions";

const clock = (seconds: number) => `00:${Math.max(0, Math.floor(seconds)).toString().padStart(2, "0")}`;
export type VijoxExperienceProps = { src: string; duration?: number | null; avatar?: string | null; name?: string; transcript?: VijoxTranscriptData | null; imageUrl?: string | null; imageAlt?: string; postId?: string | null; compact?: boolean; initialTimedReactionSummary?: VijoxTimedReactionSummary };

export default function VijoxExperience({ src, duration, avatar, name = "GigWay member", transcript, imageUrl, imageAlt = "VIJOX scene image", postId, compact = false, initialTimedReactionSummary }: VijoxExperienceProps) {
  const audio = useRef<HTMLAudioElement>(null), id = useRef(`vijox-${crypto.randomUUID()}`), context = useRef<AudioContext | null>(null), source = useRef<MediaElementAudioSourceNode | null>(null), analyser = useRef<AnalyserNode | null>(null), frame = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false), [current, setCurrent] = useState(0), [total, setTotal] = useState(duration || 27), [energy, setEnergy] = useState(0), [reactionSummary, setReactionSummary] = useState<VijoxTimedReactionSummary | null>(initialTimedReactionSummary || null);
  const stopVisualizing = () => { if (frame.current) cancelAnimationFrame(frame.current); frame.current = null; setEnergy(0); };
  const teardown = () => { stopVisualizing(); analyser.current?.disconnect(); source.current?.disconnect(); context.current?.close().catch(() => undefined); analyser.current = null; source.current = null; context.current = null; };
  const startVisualizing = () => {
    const player = audio.current; if (!player || analyser.current) return;
    try { const nextContext = new AudioContext(), nextSource = nextContext.createMediaElementSource(player), nextAnalyser = nextContext.createAnalyser(); nextAnalyser.fftSize = 256; nextSource.connect(nextAnalyser); nextAnalyser.connect(nextContext.destination); context.current = nextContext; source.current = nextSource; analyser.current = nextAnalyser; const values = new Uint8Array(nextAnalyser.fftSize); const tick = () => { nextAnalyser.getByteTimeDomainData(values); let sum = 0; values.forEach(value => { const normalized = (value - 128) / 128; sum += normalized * normalized; }); setEnergy(Math.min(1, Math.sqrt(sum / values.length) * 5)); frame.current = requestAnimationFrame(tick); }; nextContext.resume().then(tick).catch(stopVisualizing); } catch { setEnergy(0); }
  };
  useEffect(() => { const pauseOther = (event: Event) => { if ((event as CustomEvent<string>).detail !== id.current) audio.current?.pause(); }; window.addEventListener(MEDIA_PLAY_EVENT, pauseOther); return () => { window.removeEventListener(MEDIA_PLAY_EVENT, pauseOther); teardown(); }; }, []);
  const toggle = async () => { const player = audio.current; if (!player) return; if (player.paused) { if (player.ended) player.currentTime = 0; announceMediaPlay(id.current); try { await player.play(); setPlaying(true); startVisualizing(); } catch { setPlaying(false); teardown(); } } else player.pause(); };
  return <div className={`rounded-2xl border border-violet-200 bg-gradient-to-br from-pink-50 via-white to-cyan-50 ${compact ? "p-3" : "p-4"}`}>
    <audio ref={audio} src={src} preload="metadata" onLoadedMetadata={() => { if (audio.current && Number.isFinite(audio.current.duration)) setTotal(audio.current.duration); }} onTimeUpdate={() => setCurrent(audio.current?.currentTime || 0)} onPause={() => { setPlaying(false); teardown(); }} onEnded={() => { setPlaying(false); setCurrent(total); teardown(); }} onError={() => { setPlaying(false); teardown(); }} />
    {imageUrl && <div className="relative -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-xl bg-brand-ivory sm:-mx-4 sm:-mt-4"><img src={imageUrl} alt={imageAlt} className="h-44 w-full object-cover sm:h-56" /><div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 to-transparent" /></div>}
    <div className="text-center"><p className="text-[10px] font-extrabold tracking-[.14em] text-violet-700">VIJOX</p><p className="mt-0.5 text-caption text-brand-slate">Share your voice.</p><div className="mt-3"><VijoxCircularProgress currentTimeMs={Math.round(current * 1000)} durationMs={Math.round(total * 1000)} energy={energy} summary={reactionSummary} playing={playing} onToggle={toggle} label={`${clock(current)} of ${clock(total)} VIJOX playback`} center={<span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white font-extrabold text-brand-indigo">{avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : name.trim().charAt(0).toUpperCase()}</span>} /></div><p className="mt-3 text-caption font-bold tabular-nums text-brand-midnight">{clock(current)} <span className="text-brand-slate">/ {clock(total)}</span></p></div>
    {postId && <VijoxReactionMoments summary={reactionSummary} currentTimeMs={Math.round(current * 1000)} durationMs={Math.round(total * 1000)} />}
    <VijoxTranscript transcript={transcript} currentSeconds={current} />
    {postId && <VijoxTimedReactions postId={postId} currentTimeMs={() => Math.round((audio.current?.currentTime || 0) * 1000)} summary={reactionSummary} onSummaryChange={setReactionSummary} />}
  </div>;
}
