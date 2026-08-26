"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

type Person = { id: string; full_name: string | null; username: string | null; avatar_url: string | null; tagline: string | null; skills: string[] | null }
type Organization = { id: string; name: string; username: string; logo_url: string | null; tagline: string | null; industry: string | null; entity_type: "company" | "organization" | null }
type Job = { id: string; title: string; company_name: string | null; location: string | null }
type Project = { id: string; title: string; category: string | null; budget: number }
type Service = { id: string; title: string; price: number; category: string | null }
type MixedResult = { id: string; type: "person"; item: Person } | { id: string; type: "organization"; item: Organization } | { id: string; type: "job"; item: Job } | { id: string; type: "project"; item: Project } | { id: string; type: "service"; item: Service }
export type DiscoverData = { people: Person[]; organizations: Organization[]; jobs: Job[]; projects: Project[]; services: Service[]; all?: MixedResult[] }

const tabs = [["all", "All"], ["people", "People"], ["organizations", "Companies & Organizations"], ["jobs", "Jobs"], ["projects", "Projects"], ["services", "Services"]] as const

function FollowButton({ type, id, initial }: { type: "profile" | "organization"; id: string; initial: boolean }) {
  const [following, setFollowing] = useState(initial)
  const [busy, setBusy] = useState(false)
  return <button disabled={busy} onClick={async () => { setBusy(true); try { const response = await fetch(`/api/social/follow/${type}/${id}`, { method: following ? "DELETE" : "POST" }); if (response.ok) setFollowing(!following) } finally { setBusy(false) } }} className="mt-4 w-full rounded-xl border border-brand-indigo/25 py-2 text-caption font-bold text-brand-indigo">{busy ? "Working…" : following ? "Following" : "Follow"}</button>
}

function ResultCard({ result, followedProfiles, followedOrganizations }: { result: MixedResult; followedProfiles: string[]; followedOrganizations: string[] }) {
  if (result.type === "person") {
    const p = result.item
    const href = p.username ? `/u/${p.username}` : `/freelancers/${p.id}`
    return <article className="rounded-2xl border border-brand-borderLight bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-indigo/30 hover:shadow-elevated"><Link href={href} className="block"><p className="text-[10px] font-extrabold tracking-[.14em] text-brand-indigo">PERSON</p><div className="mt-3 flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-indigo/10 font-extrabold text-brand-indigo">{p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : (p.full_name || "P")[0]}</span><div className="min-w-0"><b className="block truncate text-brand-midnight">{p.full_name || "Professional"}</b><p className="mt-1 line-clamp-2 text-caption leading-5 text-brand-slate">{p.tagline || p.skills?.slice(0, 2).join(" · ") || "GigWay professional"}</p></div></div></Link>{p.skills?.length ? <div className="mt-4 flex flex-wrap gap-1">{p.skills.slice(0, 3).map(skill => <span key={skill} className="rounded-pill border border-brand-borderLight bg-brand-ivory px-2 py-0.5 text-[10px] text-brand-slate">{skill}</span>)}</div> : null}<FollowButton type="profile" id={p.id} initial={followedProfiles.includes(p.id)} /></article>
  }
  if (result.type === "organization") {
    const o = result.item
    const label = o.entity_type === "company" ? "COMPANY" : "ORGANIZATION"
    return <article className="rounded-2xl border border-brand-borderLight bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-indigo/30 hover:shadow-elevated"><Link href={`/u/${o.username}`} className="block"><p className="text-[10px] font-extrabold tracking-[.14em] text-brand-indigo">{label}</p><div className="mt-3 flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-indigo/10 font-extrabold text-brand-indigo">{o.logo_url ? <img src={o.logo_url} alt="" className="h-full w-full object-cover" /> : o.name[0]}</span><div className="min-w-0"><b className="block truncate text-brand-midnight">{o.name}</b><p className="mt-1 line-clamp-2 text-caption leading-5 text-brand-slate">{o.tagline || o.industry || label}</p></div></div></Link><FollowButton type="organization" id={o.id} initial={followedOrganizations.includes(o.id)} /></article>
  }
  const item = result.item as Job & Project & Service
  const href = result.type === "job" ? `/jobs/${item.id}` : result.type === "project" ? `/projects/${item.id}` : `/gigs/${item.id}`
  const label = result.type.toUpperCase()
  const detail = result.type === "job" ? item.company_name || "Opportunity" : item.category || label
  const value = result.type === "project" ? `₹${item.budget.toLocaleString("en-IN")}` : result.type === "service" ? `From ₹${item.price.toLocaleString("en-IN")}` : item.location || "View opportunity"
  return <Link href={href} className={result.type === "job" ? "group block rounded-2xl border border-brand-borderLight bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-indigo/30 hover:shadow-elevated md:col-span-2" : "group block rounded-2xl border border-brand-borderLight bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-indigo/30 hover:shadow-elevated"}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-extrabold tracking-[.14em] text-brand-indigo">{label}</p><b className="mt-2 block line-clamp-2 text-brand-midnight group-hover:text-brand-indigo">{item.title}</b><p className="mt-1 text-caption text-brand-slate">{detail}</p></div><span className="text-caption font-bold text-brand-indigo">View</span></div><div className="mt-5 flex items-center justify-between border-t border-brand-borderLight pt-3"><span className="font-extrabold text-brand-midnight">{value}</span><span className="text-caption font-bold text-brand-indigo">View {result.type === "service" ? "Service" : result.type === "project" ? "Project" : "Job"}</span></div></Link>
}

function Grid({ items, fp, fo }: { items: MixedResult[]; fp: string[]; fo: string[] }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{items.slice(0, 18).map((item) => <ResultCard key={item.id} result={item} followedProfiles={fp} followedOrganizations={fo} />)}</div>
}

export default function DiscoverClient({ initialData, query, tab, filters, followedProfileIds, followedOrganizationIds }: { initialData: DiscoverData; query: string; tab: string; filters: Record<string, string>; followedProfileIds: string[]; followedOrganizationIds: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query)
  const update = (changes: Record<string, string>) => {
    const params = new URLSearchParams()
    Object.entries({ ...filters, q: query, tab, ...changes }).forEach(([key, value]) => { if (value && !(key === "tab" && value === "all")) params.set(key, value) })
    router.push(`${pathname}${params.size ? `?${params}` : ""}`)
  }
  const mixed = tab === "all" && !query ? initialData.all : undefined
  const grouped: [string, MixedResult[]][] = tab === "all" ? [
    ["People", initialData.people.map((item) => ({ id: `person:${item.id}`, type: "person" as const, item }))],
    ["Companies & Organizations", initialData.organizations.map((item) => ({ id: `organization:${item.id}`, type: "organization" as const, item }))],
    ["Jobs", initialData.jobs.map((item) => ({ id: `job:${item.id}`, type: "job" as const, item }))],
    ["Projects", initialData.projects.map((item) => ({ id: `project:${item.id}`, type: "project" as const, item }))],
    ["Services", initialData.services.map((item) => ({ id: `service:${item.id}`, type: "service" as const, item }))],
  ] : tab === "people" ? [["People", initialData.people.map((item) => ({ id: `person:${item.id}`, type: "person" as const, item }))]] : tab === "organizations" ? [["Companies & Organizations", initialData.organizations.map((item) => ({ id: `organization:${item.id}`, type: "organization" as const, item }))]] : tab === "jobs" ? [["Jobs", initialData.jobs.map((item) => ({ id: `job:${item.id}`, type: "job" as const, item }))]] : tab === "projects" ? [["Projects", initialData.projects.map((item) => ({ id: `project:${item.id}`, type: "project" as const, item }))]] : [["Services", initialData.services.map((item) => ({ id: `service:${item.id}`, type: "service" as const, item }))]]
  const hasResults = !!mixed?.length || grouped.some(([, items]) => items.length)
  return <main className="min-h-screen bg-brand-ivory pb-24"><section className="border-b border-brand-borderLight bg-white"><div className="mx-auto max-w-7xl px-4 py-10"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">DISCOVER</p><h1 className="mt-2 text-h2 font-extrabold text-brand-midnight">Discover people, work and opportunities.</h1><form onSubmit={(event) => { event.preventDefault(); update({ q: search }) }} className="mt-6 flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, skills, companies, jobs, projects or services..." className="min-w-0 flex-1 rounded-xl border-2 border-brand-indigo/20 bg-white px-4 py-3 text-brand-midnight placeholder:text-brand-slate focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/20" /><button className="rounded-xl bg-brand-indigo px-5 font-bold text-white">Search</button></form></div></section><main className="mx-auto max-w-7xl px-4 py-7"><div className="flex gap-2 overflow-x-auto pb-4">{tabs.map(([value, label]) => <button key={value} onClick={() => update({ tab: value })} className={tab === value ? "rounded-pill bg-brand-indigo px-4 py-2 text-white" : "rounded-pill border border-brand-borderLight bg-white px-4 py-2 text-brand-slate transition-colors hover:border-brand-indigo/40 hover:text-brand-indigo"}>{label}</button>)}</div>{!hasResults ? <p className="py-20 text-center">No results for {query || "this search"}.</p> : mixed ? <section><h2 className="mb-4 text-h3 font-extrabold">Discover</h2><Grid items={mixed} fp={followedProfileIds} fo={followedOrganizationIds} /></section> : grouped.map(([title, items]) => items.length ? <section key={title} className="mb-10"><h2 className="mb-4 text-h3 font-extrabold">{title}</h2><Grid items={items} fp={followedProfileIds} fo={followedOrganizationIds} /></section> : null)}</main></main>
}
