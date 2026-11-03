"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, X } from "lucide-react"
import { WORK_MODES, type WorkMode } from "@/lib/identity"

const nextSteps: Record<WorkMode, { title: string; detail: string; action: string; href: string; extra?: { label: string; href: string } }> = {
  looking_for_work: {
    title: "Find your next opportunity",
    detail: "Explore jobs and freelance work that fit what you are looking for.",
    action: "Explore work",
    href: "/work",
  },
  looking_for_project: {
    title: "Find a freelance project",
    detail: "Browse projects where you can put your skills to work.",
    action: "Explore projects",
    href: "/projects",
  },
  offering_services: {
    title: "Put your skills to work",
    detail: "Create a service listing so people can see what you offer.",
    action: "Offer a service",
    href: "/gigs/new",
  },
  hiring_talent: {
    title: "Ready to hire?",
    detail: "Tell people who you need by posting a job or project.",
    action: "Post a job",
    href: "/jobs/new",
    extra: { label: "Post a project", href: "/projects/new" },
  },
  grow_network: {
    title: "Start a conversation",
    detail: "Share an update, idea, or question with your professional network.",
    action: "Write a GigThought",
    href: "/social/create",
  },
}

export default function HomeActionGuide({ userId, intents = [] }: { userId: string; intents?: string[] }) {
  const modes = useMemo(() => WORK_MODES.map(mode => mode.value).filter(mode => intents.includes(mode)), [intents])
  const modeKey = modes.join(",") || "no-intent"
  const key = `gigway:home-next-step:v1:${userId}:${modeKey}`
  const [state, setState] = useState({ owner: "", hidden: false, ready: false })

  useEffect(() => {
    let hidden = false
    try { hidden = localStorage.getItem(key) === "hidden" } catch {}
    setState({ owner: userId, hidden, ready: true })
  }, [key, userId])

  const toggle = (value: boolean) => {
    setState({ owner: userId, hidden: value, ready: true })
    try { if (value) localStorage.setItem(key, "hidden"); else localStorage.removeItem(key) } catch {}
  }

  if (!state.ready || state.owner !== userId) return null
  if (state.hidden) return <div className="mx-auto max-w-3xl"><button type="button" onClick={() => toggle(false)} className="mt-3 min-h-11 text-sm font-semibold text-brand-indigo">Show suggested next step</button></div>

  const mode = modes[0]
  const step = mode ? nextSteps[mode] : null
  return <section aria-labelledby="home-next-step-title" className="mx-auto mt-5 max-w-3xl rounded-2xl border border-brand-indigo/20 bg-white p-4 shadow-soft sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-widest text-brand-indigo">YOUR NEXT STEP</p>
        <h2 id="home-next-step-title" className="mt-1 font-extrabold text-brand-midnight">{step?.title || "Choose what you are open to"}</h2>
        <p className="mt-1 text-sm text-brand-slate">{step?.detail || "Set your interests and GigWay can point you to a useful next step."}</p>
      </div>
      <button type="button" aria-label="Dismiss suggestion" onClick={() => toggle(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-brand-slate hover:bg-brand-ivory hover:text-brand-midnight"><X className="h-4 w-4" /></button>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Link href={step?.href || "/profile/edit?section=work"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-indigo px-4 py-2 text-sm font-bold text-white">{step?.action || "Set my preferences"}<ArrowRight className="h-4 w-4" /></Link>
      {step?.extra && <Link href={step.extra.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-indigo">{step.extra.label}</Link>}
      <Link href="/create" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-indigo">See all actions</Link>
      {mode && <Link href="/profile/edit?section=work" className="inline-flex min-h-11 items-center text-sm text-brand-slate">Change interests</Link>}
    </div>
  </section>
}
