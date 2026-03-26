"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Clock, Briefcase } from "lucide-react"

interface Job {
  id: string
  title: string
  description: string
  company_name: string | null
  location: string | null
  job_type: string
  salary_min: number | null
  salary_max: number | null
  skills_required: string[] | null
  category: string | null
  created_at: string
  profiles: { full_name: string | null; company: string | null } | null
}

const JOB_TYPES = [
  { value: "", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
  { value: "contract", label: "Contract" },
]

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-500/20 text-green-400 border-green-500/30",
  "part-time": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "internship": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "remote": "bg-[#4F46E5]/20 text-[#818CF8] border-[#4F46E5]/30",
  "contract": "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [search, setSearch] = useState("")
  const [jobType, setJobType] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("jobs")
      .select("*, profiles:client_id(full_name, company)")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (jobType) query = query.eq("job_type", jobType)

    const { data, error } = await query
    if (error) { setJobs([]); setLoading(false); return }
    let results = (data as Job[]) || []

    if (search) {
      const s = search.toLowerCase()
      results = results.filter(
        j =>
          j.title?.toLowerCase().includes(s) ||
          j.description?.toLowerCase().includes(s) ||
          j.company_name?.toLowerCase().includes(s) ||
          j.skills_required?.some(sk => sk.toLowerCase().includes(s))
      )
    }

    setJobs(results)
    setLoading(false)
  }, [search, jobType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Job Listings</h1>
            <p className="text-[#6B7280] text-sm mt-1">Find full-time, part-time, and remote opportunities</p>
          </div>
          <Link
            href="/jobs/new"
            className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-semibold px-5 py-2 rounded-lg transition-opacity text-sm shadow-lg shadow-[#4F46E5]/20"
          >
            + Post Job
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            className="bg-[#12121A] border-[#1E1E2E] text-white placeholder:text-[#6B7280] pl-9 focus:border-[#4F46E5]"
          />
        </div>

        {/* Job Type Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {JOB_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setJobType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                jobType === type.value
                  ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-lg shadow-[#4F46E5]/20"
                  : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#4F46E5]/50 hover:text-white"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 h-28 skeleton" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-16 text-center">
            <Briefcase className="h-12 w-12 text-[#374151] mx-auto mb-4" />
            <p className="text-[#6B7280] mb-2">No jobs found.</p>
            <Link href="/jobs/new" className="text-[#4F46E5] hover:underline text-sm">
              Post a job →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[#6B7280] text-sm mb-4">{jobs.length} job{jobs.length !== 1 ? "s" : ""} found</p>
            <div className="space-y-4">
              {jobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#4F46E5]/40 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      {/* Company Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-bold text-lg flex-shrink-0">
                        {(job.company_name || job.profiles?.company || job.profiles?.full_name || "C")[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-white font-semibold text-lg group-hover:text-[#818CF8] transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-[#6B7280] text-sm mt-0.5">
                              {job.company_name || job.profiles?.company || job.profiles?.full_name || "Company"}
                            </p>
                          </div>
                          {job.job_type && (
                            <Badge className={`border flex-shrink-0 capitalize ${JOB_TYPE_COLORS[job.job_type] || "bg-[#1E1E2E] text-[#6B7280] border-[#1E1E2E]"}`}>
                              {job.job_type}
                            </Badge>
                          )}
                        </div>

                        {/* Salary + Location */}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#6B7280]">
                          {(job.salary_min || job.salary_max) && (
                            <span className="text-[#10B981] font-semibold">
                              {job.salary_min && job.salary_max
                                ? `₹${job.salary_min.toLocaleString()} – ₹${job.salary_max.toLocaleString()}`
                                : job.salary_min
                                ? `From ₹${job.salary_min.toLocaleString()}`
                                : `Up to ₹${job.salary_max!.toLocaleString()}`}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(job.created_at)}
                          </span>
                        </div>

                        {/* Skills */}
                        {job.skills_required && job.skills_required.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills_required.slice(0, 4).map(skill => (
                              <Badge
                                key={skill}
                                className="bg-[#4F46E5]/10 text-[#818CF8] border-[#4F46E5]/20 text-xs px-2 py-0.5"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {job.skills_required.length > 4 && (
                              <Badge className="bg-[#1E1E2E] text-[#6B7280] border-[#1E1E2E] text-xs px-2 py-0.5">
                                +{job.skills_required.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
