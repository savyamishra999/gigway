"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Clock } from "lucide-react"

interface Project {
  id: string
  title: string
  description: string
  budget: number
  category: string
  status: string
  created_at: string
  client_id: string
  profiles: { full_name: string | null } | null
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  initialProjects: Project[]
}

export default function ProjectsClient({ initialProjects }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("projects")
      .select("*, profiles:client_id(full_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (category) query = query.eq("category", category)
    if (budgetMin) query = query.gte("budget", parseFloat(budgetMin))
    if (budgetMax) query = query.lte("budget", parseFloat(budgetMax))

    const { data } = await query
    let results = (data as Project[]) || []

    if (search) {
      const s = search.toLowerCase()
      results = results.filter(
        p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)
      )
    }
    setProjects(results)
    setLoading(false)
  }, [search, category, budgetMin, budgetMax]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (search || category || budgetMin || budgetMax) {
      fetchProjects()
    } else {
      setProjects(initialProjects)
    }
  }, [search, category, budgetMin, budgetMax]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-9 focus:border-[#FFD700]"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              category === c.value
                ? "bg-[#FFD700] text-black border-[#FFD700]"
                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Budget Filter */}
      <div className="flex gap-3 mb-8">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <Input
            type="number"
            value={budgetMin}
            onChange={e => setBudgetMin(e.target.value)}
            placeholder="Min budget"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-7 w-36 focus:border-[#FFD700]"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <Input
            type="number"
            value={budgetMax}
            onChange={e => setBudgetMax(e.target.value)}
            placeholder="Max budget"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-7 w-36 focus:border-[#FFD700]"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 bg-white/5 border border-white/10 rounded-2xl px-8">
          <span className="text-5xl mb-4">🚀</span>
          <h3 className="text-white font-bold text-xl mb-2">No projects yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">Post your project and receive proposals from skilled freelancers.</p>
          <Link
            href="/projects/new"
            className="bg-[#FFD700] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#FFD700]/90 transition-opacity text-sm"
          >
            Post a Project →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#FFD700]/40 hover:bg-white/10 transition-all h-full flex flex-col">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{project.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">{project.description}</p>
                </div>
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#FFD700] font-bold text-lg">₹{project.budget.toLocaleString("en-IN")}</span>
                    <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs capitalize">
                      {CATEGORIES.find(c => c.value === project.category)?.label || project.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(project.created_at)}
                    </span>
                    <span>{project.profiles?.full_name || "Anonymous"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
