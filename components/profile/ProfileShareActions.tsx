"use client"
import Link from "next/link"
import { useState } from "react"

export default function ProfileShareActions({ username, card = false }: { username: string; card?: boolean }) {
  const [message, setMessage] = useState("")
  const url = `https://gigway.in/${card ? "gig-card" : "u"}/${encodeURIComponent(username)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setMessage("Link copied.") }
    catch { setMessage("Copy is unavailable. Select and copy the link below.") }
  }
  return <div className="mt-4 space-y-3"><div className="flex flex-wrap gap-3 text-sm font-semibold text-brand-indigo"><button type="button" onClick={() => void copy()} className="min-h-11 rounded-lg border border-brand-borderLight px-3 py-2">Copy link</button><Link prefetch={false} href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="min-h-11 rounded-lg border border-brand-borderLight px-3 py-2">Share on WhatsApp</Link>{card && <button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg border border-brand-borderLight px-3 py-2">Print card</button>}</div><p className="break-all text-xs text-brand-slate">{url}</p>{message && <p role="status" className="text-sm text-brand-slate">{message}</p>}</div>
}
