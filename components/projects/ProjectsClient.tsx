"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Search, Clock, Users, Calendar, CheckCircle2, ArrowRight, Rocket, Sparkles } from "lucide-react"

interface ProjectClient { full_name: string | null; is_verified?: boolean | null }

interface Project {
  id: string
  title: string
  description: string
  budget: number
  category: string
  skills_required: string[] | null
  status: string
  created_at: string
  deadline: string | null
  client_id: string
  poster_name?: string | null
  client?: ProjectClient | ProjectClient[] | null
  proposals?: { count: number }[]
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "web-dev", label: "Web Dev" },
  { value: "design", label: "Design" },
  { value: "mobile", label: "Mobile" },
  { value: "writing", label: "Writing" },
  { value: "marketing", label: "Marketing" },
  { value: "video", label: "Video" },
  { value: "data", label: "Data" },
  { value: "other", label: "Other" },
]

const BUDGET_TIERS = [
  { value: 0,       label: "Any budget" },
  { value: 10000,   label: "₹10k+" },
  { value: 50000,   label: "₹50k+" },
  { value: 100000,  label: "₹1L+" },
  { value: 500000,  label: "₹5L+" },
]

const DEADLINE_TIERS = [
  { value: "",        label: "Any deadline" },
  { value: "week",     label: "This week" },
  { value: "month",    label: "This month" },
  { value: "flexible", label: "Flexible" },
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function clientOf(project: Project): ProjectClient | null {
  return Array.isArray(project.client) ? project.client[0] ?? null : project.client ?? null
}

function proposalCountOf(project: Project) {
  return project.proposals?.[0]?.count ?? 0
}

// Deterministic relevance: counts how many of the viewer's profile skills
// appear in the project's required skills. No AI — pure overlap scoring.
function skillMatchScore(required: string[] | null, mySkills: string[]) {
  if (!required?.length || !mySkills.length) return 0
  const req = required.map(s => s.toLowerCase())
  return mySkills.reduce((score, skill) => score + (req.includes(skill.toLowerCase()) ? 1 : 0), 0)
}

interface Props {
  initialProjects: Project[]
  mySkills?: string[]
}

export default function ProjectsClient({ initialProjects, mySkills = [] }: Props) {
  const [projects, setProjects]   = useState<Project[]>(initialProjects)
  const [search, setSearch]       = useState("")
  const [category, setCategory]   = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [minBudget, setMinBudget] = useState(0)
  const [deadlineTier, setDeadlineTier] = useState("")
  const [loading, setLoading]     = useState(false)
  const supabase = createClient()

  const SKILL_FILTERS = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const p of initialProjects) {
      for (const sk of p.skills_required ?? []) {
        freq[sk] = (freq[sk] ?? 0) + 1
      }
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([sk]) => sk)
  }, [initialProjects])

  const hasActiveFilters = !!(search || category || skillFilter || minBudget > 0 || deadlineTier)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("projects")
      .select("*, client:client_id(full_name, is_verified), poster_name, proposals(count)")
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (category) query = query.eq("category", category)
    if (minBudget) query = query.gte("budget", minBudget)
    if (deadlineTier === "week") query = query.gte("deadline", new Date().toISOString()).lte("deadline", new Date(Date.now() + 7 * 86400000).toISOString())
    if (deadlineTier === "month") query = query.gte("deadline", new Date().toISOString()).lte("deadline", new Date(Date.now() + 30 * 86400000).toISOString())
    if (deadlineTier === "flexible") query = query.is("deadline", null)

    const { data } = await query
    let results = (data as unknown as Project[]) || []

    if (search) {
      const s = search.toLowerCase()
      results = results.filter(
        p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) ||
          p.skills_required?.some(sk => sk.toLowerCase().includes(s))
      )
    }
    if (skillFilter) {
      results = results.filter(p => p.skills_required?.some(sk => sk.toLowerCase().includes(skillFilter.toLowerCase())))
    }
    setProjects(results)
    setLoading(false)
  }, [search, category, skillFilter, minBudget, deadlineTier]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasActiveFilters) {
      fetchProjects()
    } else {
      setProjects(initialProjects)
    }
  }, [search, category, skillFilter, minBudget, deadlineTier]) // eslint-disable-line react-hooks/exhaustive-deps

  // When browsing with no active filters and the viewer has profile skills,
  // surface the best-matching projects first (deterministic, recency as tiebreaker).
  const displayedProjects = useMemo(() => {
    if (hasActiveFilters || mySkills.length === 0) return projects
    return [...projects].sort((a, b) => {
      const diff = skillMatchScore(b.skills_required, mySkills) - skillMatchScore(a.skills_required, mySkills)
      return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [projects, hasActiveFilters, mySkills])

  const clearFilters = () => {
    setSearch(""); setCategory(""); setSkillFilter(""); setMinBudget(0); setDeadlineTier("")
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-indigo" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects, skills or keywords..."
          className="w-full bg-white border-2 border-brand-indigo/15 focus:border-brand-indigo rounded-pill pl-11 pr-4 py-3.5 text-brand-midnight text-sm placeholder:text-brand-slate outline-none transition-all shadow-soft focus:ring-4 focus:ring-brand-indigo/10"
        />
      </div>

      {/* Category */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
              category === c.value
                ? "bg-brand-indigo text-white border-brand-indigo"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-indigo/40 hover:text-brand-midnight"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Budget */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BUDGET_TIERS.map(tier => (
          <button
            key={tier.value}
            onClick={() => setMinBudget(tier.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
              minBudget === tier.value
                ? "bg-brand-midnight text-white border-brand-midnight"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-midnight/30 hover:text-brand-midnight"
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* Deadline */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DEADLINE_TIERS.map(tier => (
          <button
            key={tier.value}
            onClick={() => setDeadlineTier(tier.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border flex items-center gap-1.5 ${
              deadlineTier === tier.value
                ? "bg-brand-indigo text-white border-brand-indigo"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-indigo/40 hover:text-brand-midnight"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> {tier.label}
          </button>
        ))}
      </div>

      {/* Skills */}
      {SKILL_FILTERS.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSkillFilter("")}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
              skillFilter === ""
                ? "bg-brand-coral text-white border-brand-coral"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-coral/40 hover:text-brand-midnight"
            }`}
          >
            All skills
          </button>
          {SKILL_FILTERS.map(skill => (
            <button
              key={skill}
              onClick={() => setSkillFilter(skillFilter === skill ? "" : skill)}
              className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
                skillFilter === skill
                  ? "bg-brand-coral text-white border-brand-coral"
                  : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-coral/40 hover:text-brand-midnight"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      {!hasActiveFilters && mySkills.length > 0 && displayedProjects.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 text-brand-indigo text-caption font-medium">
          <Sparkles className="h-3.5 w-3.5" /> Sorted by match to your profile skills
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-brand-borderLight rounded-card h-52 animate-pulse" />
          ))}
        </div>
      ) : displayedProjects.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedProjects.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </>
  )
}

function EmptyState({ hasActiveFilters, onClear }: { hasActiveFilters: boolean; onClear: () => void }) {
  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center text-center py-20 bg-white border border-brand-borderLight rounded-card px-8">
        <Search className="h-10 w-10 text-brand-slate/40 mb-4" />
        <h3 className="text-brand-midnight font-bold text-xl mb-2">No projects match your search yet.</h3>
        <button onClick={onClear} className="mt-2 text-brand-indigo font-semibold text-sm hover:text-brand-indigoDark">
          Clear filters
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center text-center py-20 bg-white border border-brand-borderLight rounded-card px-8">
      <Rocket className="h-10 w-10 text-brand-slate/40 mb-4" />
      <h3 className="text-brand-midnight font-bold text-xl mb-2">New projects are coming.</h3>
      <p className="text-brand-slate text-sm mb-6 max-w-xs">Post your project and receive proposals from skilled freelancers.</p>
      <Link
        href="/projects/new"
        className="bg-brand-indigo text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-indigoDark transition-colors text-sm"
      >
        Post a Project →
      </Link>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const client = clientOf(project)
  const proposalCount = proposalCountOf(project)
  const name = project.poster_name || client?.full_name || "Anonymous"

  return (
    <Link href={`/projects/${project.id}`}
      className="group bg-white border border-brand-borderLight rounded-card p-5 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 hover:border-brand-indigo/30 transition-all h-full flex flex-col">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-brand-midnight font-bold text-body-lg leading-tight line-clamp-2 group-hover:text-brand-indigo transition-colors">
            {project.title}
          </h3>
          <span className="flex-shrink-0 text-caption font-semibold px-2.5 py-1 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 capitalize">
            {CATEGORIES.find(c => c.value === project.category)?.label || project.category}
          </span>
        </div>
        <p className="text-brand-slate text-body-sm line-clamp-2 mb-4">{project.description}</p>

        {project.skills_required && project.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.skills_required.slice(0, 3).map(skill => (
              <span key={skill} className="text-caption px-2 py-0.5 rounded-pill bg-brand-ivory text-brand-slate border border-brand-borderLight">
                {skill}
              </span>
            ))}
            {project.skills_required.length > 3 && (
              <span className="text-caption px-2 py-0.5 rounded-pill bg-brand-ivory text-brand-slate border border-brand-borderLight">
                +{project.skills_required.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-brand-borderLight">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-brand-midnight font-extrabold text-lg">₹{project.budget.toLocaleString("en-IN")}</span>
          {project.deadline && (
            <span className="flex items-center gap-1 text-caption text-brand-slate">
              <Calendar className="h-3 w-3" /> {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-caption text-brand-slate">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="truncate">{name}</span>
            {client?.is_verified && <CheckCircle2 className="h-3 w-3 text-brand-indigo flex-shrink-0" />}
          </span>
          <span className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{proposalCount}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(project.created_at)}</span>
          </span>
        </div>
        <span className="mt-3 flex items-center justify-center gap-1.5 w-full text-brand-indigo text-caption font-semibold py-2 rounded-lg bg-brand-indigo/5 group-hover:bg-brand-indigo/10 transition-colors">
          View Project <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
