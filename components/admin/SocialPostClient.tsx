"use client"

import { useState } from "react"
import { Copy, Check, Download, Twitter, Linkedin } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

type GigProfile = { full_name: string | null; verification_status: string | null }

type Gig = {
  id: string
  title: string
  price: number | null
  category: string | null
  profiles: GigProfile | GigProfile[] | null
}

type Job = {
  id: string
  title: string
  company_name: string | null
  location: string | null
  job_type: string | null
  required_skills: string[] | null
  salary_min: number | null
  salary_max: number | null
}

type Freelancer = {
  id: string
  full_name: string | null
  skills: string[] | null
  hourly_rate: number | null
  location: string | null
  verification_status: string | null
}

type Tab = "gig" | "job" | "freelancer"

function gigProfile(g: Gig): GigProfile | null {
  if (!g.profiles) return null
  return Array.isArray(g.profiles) ? (g.profiles[0] ?? null) : g.profiles
}

// ── Text generators ───────────────────────────────────────────────────────────

function twitterText(tab: Tab, item: Gig | Job | Freelancer): string {
  if (tab === "gig") {
    const g = item as Gig
    const prof = gigProfile(g)
    const name = prof?.full_name ?? "Freelancer"
    const price = g.price ? `₹${g.price.toLocaleString("en-IN")}` : ""
    return `⚡ New Gig on GigWay!\n\n"${g.title}"\nby ${name}${price ? ` · Starting ${price}` : ""}\n\n🔗 gigway.in/gigs/${g.id}\n\n#GigWay #Freelance #India #ZeroCommission`
  }
  if (tab === "job") {
    const j = item as Job
    const sal = j.salary_min && j.salary_max
      ? ` · ₹${Math.round(j.salary_min / 100000)}L–${Math.round(j.salary_max / 100000)}L`
      : ""
    return `💼 Hiring on GigWay!\n\n${j.title}${j.company_name ? ` @ ${j.company_name}` : ""}${j.location ? ` · ${j.location}` : ""}${sal}\n\n🔗 gigway.in/jobs/${j.id}\n\n#Jobs #Hiring #GigWay #India`
  }
  const f = item as Freelancer
  const rate = f.hourly_rate ? ` · ₹${f.hourly_rate}/hr` : ""
  const top3 = (f.skills ?? []).slice(0, 3).join(", ")
  return `👤 Freelancer on GigWay!\n\n${f.full_name ?? "Freelancer"}${f.verification_status === "approved" ? " ✅" : ""}${rate}\n${top3 ? `Skills: ${top3}` : ""}\n\n🔗 gigway.in/freelancers/${f.id}\n\n#Freelancer #GigWay #India #HireNow`
}

function linkedinText(tab: Tab, item: Gig | Job | Freelancer): string {
  if (tab === "gig") {
    const g = item as Gig
    const prof = gigProfile(g)
    const name = prof?.full_name ?? "a talented freelancer"
    const price = g.price ? `₹${g.price.toLocaleString("en-IN")}` : ""
    const verified = prof?.verification_status === "approved"
    return `🚀 New Gig on GigWay — India's Zero Commission Platform!

${name}${verified ? " ✅ Verified" : ""} is offering:
"${g.title}"${price ? `\n💰 Starting at ${price}` : ""}${g.category ? `\n📂 ${g.category}` : ""}

Zero commission means freelancers keep 100% of what they earn.

👉 Check it out: gigway.in/gigs/${g.id}

#GigWay #Freelance #India #ZeroCommission #WorkFromAnywhere`
  }
  if (tab === "job") {
    const j = item as Job
    const sal = j.salary_min && j.salary_max
      ? `\n💰 ₹${Math.round(j.salary_min / 100000)}L – ₹${Math.round(j.salary_max / 100000)}L per year`
      : ""
    const skills = (j.required_skills ?? []).slice(0, 5).join(", ")
    return `💼 Job Alert on GigWay!

${j.company_name ?? "A company"} is hiring:
🔹 ${j.title}${j.location ? `\n📍 ${j.location}` : ""}${j.job_type ? `\n🕐 ${j.job_type.replace("-", " ")}` : ""}${sal}${skills ? `\n\nRequired: ${skills}` : ""}

Apply free — no commission, no hidden fees.

👉 gigway.in/jobs/${j.id}

#Jobs #Hiring #TechJobs #GigWay #India`
  }
  const f = item as Freelancer
  const rate = f.hourly_rate ? `₹${f.hourly_rate}/hr` : ""
  const skills = (f.skills ?? []).slice(0, 6).join(", ")
  return `👤 Meet a top Freelancer on GigWay!

${f.full_name ?? "A skilled freelancer"}${f.verification_status === "approved" ? " ✅ Verified" : ""}${f.location ? ` · 📍 ${f.location}` : ""}${rate ? `\n💰 ${rate}` : ""}${skills ? `\n\nSkills: ${skills}` : ""}

Hire them with zero commission — what you pay is what they earn.

👉 gigway.in/freelancers/${f.id}

#Freelancer #Hiring #GigWay #India #ZeroCommission`
}

function cardUrl(tab: Tab, item: Gig | Job | Freelancer, base: string): string {
  const p = new URLSearchParams({ type: tab })

  if (tab === "gig") {
    const g = item as Gig
    p.set("title", g.title)
    p.set("sub", gigProfile(g)?.full_name ?? "")
    if (g.price) p.set("price", `₹${g.price.toLocaleString("en-IN")}`)
    if (g.category) p.set("skills", g.category)
    if (gigProfile(g)?.verification_status === "approved") p.set("verified", "1")
  } else if (tab === "job") {
    const j = item as Job
    p.set("title", j.title)
    p.set("sub", j.company_name ?? "")
    if (j.location) p.set("location", j.location)
    if (j.salary_min && j.salary_max)
      p.set("price", `₹${Math.round(j.salary_min / 100000)}L–${Math.round(j.salary_max / 100000)}L/yr`)
    if (j.required_skills?.length) p.set("skills", j.required_skills.slice(0, 5).join(","))
  } else {
    const f = item as Freelancer
    p.set("title", f.full_name ?? "Freelancer")
    if (f.hourly_rate) p.set("price", `₹${f.hourly_rate}/hr`)
    if (f.location) p.set("location", f.location)
    if (f.skills?.length) p.set("skills", f.skills.slice(0, 5).join(","))
    if (f.verification_status === "approved") p.set("verified", "1")
  }
  return `${base}/api/social-card?${p.toString()}`
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SocialPostClient({
  gigs, jobs, freelancers,
}: {
  gigs: Gig[]
  jobs: Job[]
  freelancers: Freelancer[]
}) {
  const [tab, setTab]         = useState<Tab>("gig")
  const [selected, setSelected] = useState<Gig | Job | Freelancer | null>(null)
  const [copied, setCopied]   = useState<"tw" | "li" | null>(null)
  const [dlLoading, setDlLoading] = useState(false)

  const items: (Gig | Job | Freelancer)[] =
    tab === "gig" ? gigs : tab === "job" ? jobs : freelancers

  const base = typeof window !== "undefined" ? window.location.origin : ""

  const twText = selected ? twitterText(tab, selected) : ""
  const liText = selected ? linkedinText(tab, selected) : ""
  const imgUrl = selected ? cardUrl(tab, selected, base) : ""

  async function copyText(which: "tw" | "li") {
    await navigator.clipboard.writeText(which === "tw" ? twText : liText)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  async function downloadCard() {
    if (!imgUrl) return
    setDlLoading(true)
    try {
      const res  = await fetch(imgUrl)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = "gigway-post.png"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDlLoading(false)
    }
  }

  function itemLabel(t: Tab, item: Gig | Job | Freelancer): string {
    if (t === "gig") return (item as Gig).title
    if (t === "job") return `${(item as Job).title}${(item as Job).company_name ? ` — ${(item as Job).company_name}` : ""}`
    return (item as Freelancer).full_name ?? "Freelancer"
  }

  const TABS: { key: Tab; label: string; color: string; count: number }[] = [
    { key: "gig",        label: "🎨 Gigs",        color: "#818CF8", count: gigs.length },
    { key: "job",        label: "💼 Jobs",        color: "#F97316", count: jobs.length },
    { key: "freelancer", label: "👤 Freelancers", color: "#4ADE80", count: freelancers.length },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Left: select item ── */}
      <div className="bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#1E1E2E]">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected(null) }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                tab === t.key
                  ? "text-white border-b-2"
                  : "text-[#6B7280] hover:text-white"
              }`}
              style={tab === t.key ? { borderColor: t.color } : {}}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[520px] overflow-y-auto divide-y divide-[#1E1E2E]">
          {items.length === 0 ? (
            <p className="p-8 text-center text-[#4B5563] text-sm">No items found</p>
          ) : items.map(item => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left px-5 py-3.5 hover:bg-[#1E1E2E] transition-colors ${
                selected?.id === item.id ? "bg-[#1E1E2E]" : ""
              }`}
            >
              <p className={`text-sm font-medium line-clamp-1 ${
                selected?.id === item.id ? "text-white" : "text-[#CBD5E1]"
              }`}>
                {itemLabel(tab, item)}
              </p>
              {tab === "gig" && (
                <p className="text-[#6B7280] text-xs mt-0.5">
                  {gigProfile(item as Gig)?.full_name ?? "—"} · ₹{(item as Gig).price?.toLocaleString("en-IN") ?? "—"}
                </p>
              )}
              {tab === "job" && (item as Job).location && (
                <p className="text-[#6B7280] text-xs mt-0.5">{(item as Job).location}</p>
              )}
              {tab === "freelancer" && (item as Freelancer).skills?.length ? (
                <p className="text-[#6B7280] text-xs mt-0.5">
                  {(item as Freelancer).skills!.slice(0, 3).join(" · ")}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: preview + copy ── */}
      <div className="space-y-4">
        {!selected ? (
          <div className="bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl p-16 text-center">
            <p className="text-[#4B5563] text-sm">← Select an item to generate post</p>
          </div>
        ) : (
          <>
            {/* Card preview */}
            <div className="bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">Card Preview</p>
                <button
                  onClick={downloadCard}
                  disabled={dlLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F46E5]/20 hover:bg-[#4F46E5]/30 text-[#818CF8] text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {dlLoading ? "Downloading…" : "Download PNG"}
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt="Social card preview"
                className="w-full rounded-xl border border-[#1E1E2E]"
                style={{ aspectRatio: "1200/630" }}
              />
            </div>

            {/* Twitter text */}
            <div className="bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  <p className="text-white font-bold text-sm">Twitter / X</p>
                  <span className={`text-xs ${twText.length > 280 ? "text-red-400" : "text-[#4B5563]"}`}>
                    {twText.length}/280
                  </span>
                </div>
                <button
                  onClick={() => copyText("tw")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] text-xs font-bold transition-colors"
                >
                  {copied === "tw" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "tw" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-[#94A3B8] text-xs leading-relaxed whitespace-pre-wrap font-sans bg-[#12121A] rounded-xl p-3 border border-[#1E1E2E]">
                {twText}
              </pre>
            </div>

            {/* LinkedIn text */}
            <div className="bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                  <p className="text-white font-bold text-sm">LinkedIn</p>
                </div>
                <button
                  onClick={() => copyText("li")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] text-xs font-bold transition-colors"
                >
                  {copied === "li" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "li" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-[#94A3B8] text-xs leading-relaxed whitespace-pre-wrap font-sans bg-[#12121A] rounded-xl p-3 border border-[#1E1E2E]">
                {liText}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
