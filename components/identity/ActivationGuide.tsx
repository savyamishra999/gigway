"use client"

import Link from "next/link"
import { useState } from "react"

export default function ActivationGuide({ continueHref = "/home", ready = false }: { continueHref?: string; ready?: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return <Link prefetch={false} href={continueHref} className="inline-block rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white">Continue to GigWay</Link>
  return <section aria-labelledby="activation-heading" className="rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-6">
    <div className="flex items-start justify-between gap-3"><h2 id="activation-heading" className="text-h3 font-extrabold text-brand-midnight">{ready ? "Your profile is ready" : "How GigWay works"}</h2><Link prefetch={false} href={continueHref} aria-label="Close guidance" className="rounded-lg px-3 py-2 text-brand-slate">×</Link></div>
    <p className="mt-3 text-body-sm text-brand-slate">Your Professional Identity represents you as a person. A Workplace is your company, startup or organization page.</p>
    <p className="mt-3 text-body-sm text-brand-slate">Find work, build your network, share a GigThought or offer a service. Start with one action, or explore at your own pace.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">{[
      { href: "/work", label: "Explore Work", help: "Work brings jobs, projects and services together." },
      { href: "/network", label: "Find People", help: "Network helps you find professionals and follow Workplaces." },
      { href: "/social/create", label: "Share a GigThought", help: "The center + Create action also lets you post work or offer a service." },
    ].map(action => <Link prefetch={false} key={action.href} href={action.href} className="min-w-0 rounded-xl border border-brand-borderLight p-4 hover:border-brand-indigo"><b className="block text-sm text-brand-indigo">{action.label}</b><span className="mt-2 block text-xs leading-5 text-brand-slate">{action.help}</span></Link>)}</div>
    <div className="mt-5 flex flex-wrap items-center gap-4"><Link prefetch={false} href={continueHref} className="rounded-xl bg-brand-indigo px-4 py-3 text-sm font-bold text-white">Skip for now</Link><button type="button" onClick={() => setDismissed(true)} className="rounded-lg px-3 py-3 text-sm font-semibold text-brand-slate">Hide tips</button></div>
    <p className="mt-3 text-xs text-brand-slate">Replay this guide from How GigWay works in your account menu.</p>
  </section>
}
