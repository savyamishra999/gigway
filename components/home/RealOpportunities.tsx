"use client"

import { useState } from "react"
import Link from "next/link"
import { Briefcase, Clock, MapPin, Sparkles, Star } from "lucide-react"

type Job = { id: string; title: string; company_name: string | null; location: string | null; salary_min: number | null; salary_max: number | null; skills_required: string[] | null; created_at: string }
type Project = { id: string; title: string; budget: number | null; category: string | null; skills_required: string[] | null; created_at: string }
type Gig = { id: string; title: string; price: number; delivery_days: number | null; image_url: string | null; category: string | null; profiles: { full_name: string | null; avg_rating: number | null; is_verified: boolean } | { full_name: string | null; avg_rating: number | null; is_verified: boolean }[] | null }

function timeAgo(dateStr: string) {
  const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
  if (hrs < 1) return "Just now"
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Shell({ href, eyebrow, icon: Icon, title, meta, tags, footer }: {
  href: string; eyebrow: string; icon: typeof Briefcase; title: string; meta?: React.ReactNode; tags?: string[] | null; footer?: React.ReactNode
}) {
  return (
    <Link href={href} className="bg-white/[.04] border border-white/10 hover:border-brand-indigo/40 hover:-translate-y-1 rounded-card p-5 transition-all duration-200 group h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 flex items-center justify-center">
          <Icon className="h-5 w-5 text-indigo-300" />
        </div>
        <span className="text-slate-500 text-caption">{eyebrow}</span>
      </div>
      <h3 className="text-white font-semibold text-body-sm line-clamp-2 mb-2 group-hover:text-indigo-300 transition-colors">{title}</h3>
      {meta && <p className="text-slate-400 text-caption flex items-center gap-1 mb-3">{meta}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-caption bg-white/5 text-slate-300 px-2 py-0.5 rounded-pill border border-white/5">{tag}</span>
          ))}
        </div>
      )}
      <div className="mt-auto pt-2">{footer}</div>
    </Link>
  )
}

const TABS = [
  { key: "jobs", label: "Jobs" },
  { key: "projects", label: "Projects" },
  { key: "gigs", label: "Services" },
] as const
type TabKey = (typeof TABS)[number]["key"]

export default function RealOpportunities({ jobs, projects, gigs }: { jobs: Job[]; projects: Project[]; gigs: Gig[] }) {
  const [tab, setTab] = useState<TabKey>("jobs")
  const counts: Record<TabKey, number> = { jobs: jobs.length, projects: projects.length, gigs: gigs.length }
  const hasAny = jobs.length > 0 || projects.length > 0 || gigs.length > 0
  if (!hasAny) return null

  return (
    <section className="bg-brand-midnight py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <p className="text-indigo-300 font-bold text-body-sm uppercase tracking-widest mb-2">Real Opportunities</p>
            <h2 className="text-h2 font-extrabold text-white">Live on GigWay right now</h2>
          </div>
          <div className="flex gap-1.5">
            {TABS.map(t => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                disabled={counts[t.key] === 0}
                className={`px-4 py-2 rounded-xl text-body-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  tab === t.key ? "bg-brand-indigo text-white" : "bg-white/5 text-slate-300 hover:text-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tab === "jobs" && jobs.map(job => (
            <Shell key={job.id} href={`/jobs/${job.id}`} eyebrow={timeAgo(job.created_at)} icon={Briefcase} title={job.title}
              meta={<>{job.company_name || "GigWay employer"}{job.location && <><span className="mx-1 text-slate-600">·</span><MapPin className="h-3 w-3 inline" /> {job.location}</>}</>}
              tags={job.skills_required}
              footer={(job.salary_min || job.salary_max) && (
                <p className="text-emerald-300 font-bold text-body-sm">
                  ₹{job.salary_min?.toLocaleString() ?? ""}{job.salary_max && ` – ₹${job.salary_max.toLocaleString()}`}
                </p>
              )} />
          ))}

          {tab === "projects" && projects.map(project => (
            <Shell key={project.id} href={`/projects/${project.id}`} eyebrow={timeAgo(project.created_at)} icon={Sparkles} title={project.title}
              meta={project.category}
              tags={project.skills_required}
              footer={project.budget && <p className="text-emerald-300 font-bold text-body-sm">₹{project.budget.toLocaleString()} budget</p>} />
          ))}

          {tab === "gigs" && gigs.map(gig => {
            const creator = Array.isArray(gig.profiles) ? gig.profiles[0] : gig.profiles
            return (
              <Shell key={gig.id} href={`/gigs/${gig.id}`} eyebrow={gig.category ?? "Service"} icon={Star} title={gig.title}
                meta={creator?.full_name || "Freelancer"}
                footer={
                  <div className="flex items-center justify-between">
                    <p className="text-indigo-300 font-bold text-body-sm">₹{gig.price.toLocaleString()}</p>
                    {gig.delivery_days && <span className="flex items-center gap-1 text-slate-400 text-caption"><Clock className="h-3 w-3" />{gig.delivery_days}d</span>}
                  </div>
                } />
            )
          })}
        </div>
      </div>
    </section>
  )
}
