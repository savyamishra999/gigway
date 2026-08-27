"use client";

import { Expand, Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { announceMediaPlay, MEDIA_PLAY_EVENT } from "@/lib/social/media-playback";
import { classifyVideoPresentation } from "@/lib/social/video";

type Props = { id: string; src: string; fileName: string; width?: number | null; height?: number | null; durationSeconds?: number | null };
const label = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

export default function GigVideoPlayer({ id, src, fileName, width, height, durationSeconds }: Props) {
  const video = useRef<HTMLVideoElement>(null), surface = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [current, setCurrent] = useState(0), [duration, setDuration] = useState(durationSeconds || 0), [muted, setMuted] = useState(false);
  const portrait = classifyVideoPresentation({ width, height, durationSeconds }) === "SHORT_VERTICAL";
  useEffect(() => {
    const pauseOther = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) video.current?.pause(); };
    window.addEventListener(MEDIA_PLAY_EVENT, pauseOther);
    return () => window.removeEventListener(MEDIA_PLAY_EVENT, pauseOther);
  }, [id]);
  const toggle = async () => {
    const player = video.current; if (!player || failed) return;
    if (player.paused) { announceMediaPlay(id); try { await player.play(); } catch { setFailed(true); } } else player.pause();
  };
  const fullscreen = () => surface.current?.requestFullscreen?.();
  return <div ref={surface} className={`relative mt-4 overflow-hidden rounded-2xl border border-brand-indigo/15 bg-brand-midnight shadow-soft ${portrait ? "mx-auto w-full max-w-[22rem]" : "w-full"}`}>
    <video ref={video} src={src} preload="metadata" playsInline muted={muted} aria-label={`Video: ${fileName}`} className={portrait ? "block aspect-[9/16] max-h-[70vh] w-full object-contain" : "block max-h-[65vh] w-full object-contain"} onLoadedMetadata={() => { setDuration(video.current?.duration || durationSeconds || 0); setLoading(false); }} onCanPlay={() => setLoading(false)} onWaiting={() => setLoading(true)} onPlaying={() => { setPlaying(true); setLoading(false); }} onPause={() => setPlaying(false)} onTimeUpdate={() => setCurrent(video.current?.currentTime || 0)} onEnded={() => setPlaying(false)} onError={() => { setFailed(true); setLoading(false); }} />
    {loading && !failed && <div className="absolute inset-0 grid place-items-center bg-brand-midnight/25"><Loader2 className="h-6 w-6 animate-spin text-white" aria-label="Loading video" /></div>}
    {failed ? <div className="absolute inset-0 grid place-items-center bg-brand-midnight/85 p-6 text-center text-sm font-semibold text-white">This video could not be played. Please try again later.</div> : <>
      {!playing && !loading && <button onClick={toggle} className="absolute inset-0 grid place-items-center" aria-label="Play video"><span className="grid h-14 w-14 place-items-center rounded-full bg-brand-indigo text-white shadow-elevated"><Play className="ml-0.5 h-6 w-6 fill-current" /></span></button>}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-white"><input aria-label="Video progress" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(current, duration || 1)} onChange={(event) => { if (video.current) video.current.currentTime = Number(event.target.value); setCurrent(Number(event.target.value)); }} className="mb-2 block w-full accent-brand-coral" /><div className="flex items-center gap-2"><button onClick={toggle} aria-label={playing ? "Pause video" : "Play video"} className="rounded-full p-1.5 hover:bg-white/15">{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button><span className="text-caption font-bold tabular-nums">{label(current)} / {label(duration)}</span><span className="flex-1" /><button onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute video" : "Mute video"} className="rounded-full p-1.5 hover:bg-white/15">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button><button onClick={fullscreen} aria-label="Play video fullscreen" className="rounded-full p-1.5 hover:bg-white/15"><Expand className="h-4 w-4" /></button></div></div>
    </>}
  </div>;
}
