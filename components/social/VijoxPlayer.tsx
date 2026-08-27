"use client"
import { Pause, Play } from "lucide-react"
import { useRef, useState } from "react"

export default function VijoxPlayer({ src, duration }: { src: string; duration?: number | null }) {
  const audio = useRef<HTMLAudioElement>(null), [playing, setPlaying] = useState(false), [current, setCurrent] = useState(0)
  const total = duration || 27, label = (seconds: number) => `00:${Math.floor(seconds).toString().padStart(2, "0")}`
  const toggle = async () => { const player = audio.current; if (!player) return; if (player.paused) { await player.play(); setPlaying(true) } else { player.pause(); setPlaying(false) } }
  return <div className="mt-4 rounded-2xl border border-brand-indigo/20 bg-gradient-to-br from-brand-indigo/10 to-brand-coral/10 p-4"><audio ref={audio} src={src} preload="metadata" onTimeUpdate={() => setCurrent(audio.current?.currentTime || 0)} onEnded={() => setPlaying(false)} onError={() => setPlaying(false)} /><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold tracking-[.14em] text-brand-indigo">VIJOX</p><p className="text-caption text-brand-slate">Share your voice · 27 sec max</p></div><button onClick={toggle} aria-label={playing ? "Pause VIJOX" : "Play VIJOX"} className="grid h-10 w-10 place-items-center rounded-full bg-brand-indigo text-white">{playing ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}</button></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><span className="block h-full bg-brand-indigo" style={{width:`${Math.min(100,current / total * 100)}%`}}/></div><p className="mt-2 text-right text-caption font-bold text-brand-slate">{label(current)} / {label(total)}</p></div>
}
