"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const actions = [
  { href: "/social/create?intro=1", title: "Share an introduction", detail: "Tell people what you do and what brings you here.", icon: "💬", color: "bg-indigo-50" },
  { href: "/work", title: "Find jobs or projects", detail: "Explore opportunities for your next move.", icon: "💼", color: "bg-sky-50" },
  { href: "/gigs/new", title: "Offer my services", detail: "Show people the work you can do for them.", icon: "🎨", color: "bg-amber-50" },
  { href: "/create", title: "Hire someone", detail: "Choose Job for a role or Project for a specific task.", icon: "🤝", color: "bg-orange-50" },
  { href: "/network", title: "Meet people", detail: "Discover professionals and follow their updates.", icon: "🌱", color: "bg-emerald-50" },
]

export default function HomeActionGuide({ userId }: { userId: string }) {
  const [state, setState] = useState({ owner: "", hidden: false, posted: false })
  const key = `gigway:home-guide:v1:${userId}`
  useEffect(() => {
    let hidden = false, posted = false
    try { hidden = localStorage.getItem(key) === "hidden"; posted = localStorage.getItem(`gigway:introduction:${userId}`) === "posted" } catch {}
    setState({ owner: userId, hidden, posted })
  }, [key, userId])
  const hidden = state.owner === userId && state.hidden
  const toggle = (value: boolean) => {
    setState(current => ({ ...current, owner: userId, hidden: value }))
    try { if (value) localStorage.setItem(key, "hidden"); else localStorage.removeItem(key) } catch {}
  }
  if (hidden) return <button onClick={() => toggle(false)} className="my-3 min-h-11 rounded-xl px-3 text-sm font-semibold text-brand-indigo">Show getting-started guide</button>
  return <section aria-labelledby="home-guide-title" className="mt-5 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-soft">
    <div className="bg-gradient-to-r from-indigo-50 via-violet-50 to-orange-50 p-4 sm:p-5">
      <p className="text-xs font-bold tracking-widest text-brand-indigo">YOUR NEXT STEP</p>
      <h2 id="home-guide-title" className="mt-1 text-xl font-extrabold text-brand-midnight">What would you like to do first?</h2>
      <p className="mt-2 text-sm text-brand-slate">Start with one action. You can explore everything else later.</p>
    </div>
    <div className="grid gap-2 p-3 sm:grid-cols-2">
      {actions.filter(action => !(state.owner === userId && state.posted && action.href.includes("intro=1"))).map(action => <Link key={action.href} href={action.href} className={`min-w-0 rounded-xl p-4 ${action.color} focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-indigo`}>
        <span aria-hidden="true" className="text-2xl">{action.icon}</span><h3 className="mt-2 font-bold text-brand-midnight">{action.title}</h3><p className="mt-1 text-sm text-brand-slate">{action.detail}</p>
      </Link>)}
    </div>
    <details className="mx-3 rounded-xl border border-brand-borderLight p-3">
      <summary className="cursor-pointer py-1 text-sm font-bold text-brand-midnight">Building a startup, business or community?</summary>
      <p className="mt-2 text-sm text-brand-slate">Your profile represents you. A Workplace gives your organization its own page.</p>
      <Link href="/organizations/new" className="mt-2 inline-flex min-h-11 items-center font-bold text-brand-indigo">Create a Workplace →</Link>
    </details>
    <button onClick={() => toggle(true)} className="m-3 min-h-11 rounded-lg px-3 text-sm font-semibold text-brand-slate">Explore Home instead</button>
  </section>
}
