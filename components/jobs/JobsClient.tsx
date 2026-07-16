"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Clock, Star } from "lucide-react"

interface Job {
  id: string
  title: string
  description?: string
  company_name: string | null
  location: string | null
  job_type: string
  salary_min: number | null
  salary_max: number | null
  skills_required: string[] | null
  created_at: string
  is_featured?: boolean | null
  featured_until?: string | null
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
  "full-time":  "bg-green-500/20 text-green-400 border-green-500/30",
  "part-time":  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "internship": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "remote":     "bg-[#4F46E5]/20 text-[#818CF8] border-[#4F46E5]/30",
  "contract":   "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function isFeaturedActive(job: Job) {
  if (!job.is_featured) return false
  if (!job.featured_until) return true
  return new Date(job.featured_until) > new Date()
}

interface Props {
  initialJobs: Job[]
  canPostJob?: boolean
  isJobSeeker?: boolean
}

export default function JobsClient({ initialJobs, canPostJob = false, isJobSeeker = false }: Props) {
  const [jobs, setJobs]       = useState<Job[]>(initialJobs)
  const [search, setSearch]   = useState("")
  const [jobType, setJobType] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const supabase = createClient()

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError("")
    let query = supabase
      .from("jobs")
      .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, created_at, is_featured, featured_until")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (jobType) query = query.eq("job_type", jobType)

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
      setJobs([])
      setLoading(false)
      return
    }

    let results = (data as Job[]) || []
    if (search) {
      const s = search.toLowerCase()
      results = results.filter(
        j =>
          j.title?.toLowerCase().includes(s) ||
          j.company_name?.toLowerCase().includes(s) ||
          j.skills_required?.some(sk => sk.toLowerCase().includes(s))
      )
    }
    setJobs(results)
    setLoading(false)
  }, [search, jobType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (search || jobType) {
      fetchJobs()
    } else {
      setJobs(initialJobs)
    }
  }, [search, jobType]) // eslint-disable-line react-hooks/exhaustive-deps

  const featuredJobs = jobs.filter(isFeaturedActive)
  const regularJobs  = jobs.filter(j => !isFeaturedActive(j))

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isJobSeeker ? "Search jobs, companies, skills..." : "Search listings..."}
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

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#12121A] border border-red-500/30 rounded-2xl p-10 text-center">
          <p className="text-red-400 font-semibold mb-1">Failed to load jobs</p>
          <p className="text-[#6B7280] text-sm">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState canPostJob={canPostJob} isJobSeeker={isJobSeeker} />
      ) : (
        <>
          <p className="text-[#6B7280] text-sm mb-6">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
            {featuredJobs.length > 0 && (
              <span className="ml-2 text-[#F59E0B]">· {featuredJobs.length} featured</span>
            )}
          </p>

          {/* Featured section */}
          {featuredJobs.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-[#F59E0B] text-sm font-semibold">Featured Jobs</span>
              </div>
              <div className="space-y-4">
                {featuredJobs.map(job => <JobCard key={job.id} job={job} featured />)}
              </div>
              {regularJobs.length > 0 && (
                <div className="border-t border-[#1E1E2E] mt-8 mb-6 flex items-center gap-3">
                  <span className="text-[#6B7280] text-xs bg-[#0A0A0F] pr-3">All Jobs</span>
                </div>
              )}
            </div>
          )}

          {/* Regular listings */}
          <div className="space-y-4">
            {regularJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>

          {/* Company: boost prompt below listings */}
          {canPostJob && (
            <div className="mt-10 bg-gradient-to-r from-[#F59E0B]/10 to-[#F97316]/10 border border-[#F59E0B]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold">Get more applicants — fast</p>
                <p className="text-[#6B7280] text-sm mt-0.5">Boost your listing to the top of search results. Pay once, stay featured for 30 days.</p>
              </div>
              <Link
                href="/dashboard/jobs/boost"
                className="flex-shrink-0 bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#F59E0B]/20"
              >
                ⚡ Boost a Listing
              </Link>
            </div>
          )}
        </>
      )}
    </>
  )
}

function EmptyState({ canPostJob, isJobSeeker }: { canPostJob: boolean; isJobSeeker: boolean }) {
  if (isJobSeeker) {
    return (
      <div className="flex flex-col items-center text-center py-20 bg-[#12121A] border border-[#1E1E2E] rounded-2xl px-8">
        <span className="text-5xl mb-4">🔍</span>
        <h3 className="text-white font-bold text-xl mb-2">No jobs found</h3>
        <p className="text-[#6B7280] text-sm max-w-xs">
          No listings match your search right now. Try different keywords or check back soon — new jobs are posted daily.
        </p>
      </div>
    )
  }

  if (canPostJob) {
    return (
      <div className="flex flex-col items-center text-center py-20 bg-[#12121A] border border-[#1E1E2E] rounded-2xl px-8">
        <span className="text-5xl mb-4">📋</span>
        <h3 className="text-white font-bold text-xl mb-2">No jobs posted yet</h3>
        <p className="text-[#6B7280] text-sm mb-6 max-w-xs">
          Post your first job and start receiving applications from India&apos;s top talent.
        </p>
        <Link
          href="/jobs/new"
          className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          Post a Job →
        </Link>
      </div>
    )
  }

  // Logged out / unknown role
  return (
    <div className="flex flex-col items-center text-center py-20 bg-[#12121A] border border-[#1E1E2E] rounded-2xl px-8">
      <span className="text-5xl mb-4">💼</span>
      <h3 className="text-white font-bold text-xl mb-2">No jobs found</h3>
      <p className="text-[#6B7280] text-sm max-w-xs">Check back soon — new opportunities are added every day.</p>
    </div>
  )
}

function JobCard({ job, featured = false }: { job: Job; featured?: boolean }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className={`bg-[#12121A] border rounded-xl p-5 hover:border-[#4F46E5]/40 transition-all group ${
        featured ? "border-[#F59E0B]/30 shadow-[0_0_24px_rgba(245,158,11,0.06)]" : "border-[#1E1E2E]"
      }`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-bold text-lg flex-shrink-0">
            {(job.company_name || "C")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold text-lg group-hover:text-[#818CF8] transition-colors leading-tight">
                    {job.title}
                  </h3>
                  {featured && (
                    <span className="flex items-center gap-1 text-[#F59E0B] text-xs font-semibold bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      <Star className="h-3 w-3 fill-[#F59E0B]" /> Featured
                    </span>
                  )}
                </div>
                <p className="text-[#6B7280] text-sm mt-0.5">{job.company_name || "Company"}</p>
              </div>
              {job.job_type && (
                <Badge className={`border flex-shrink-0 capitalize ${JOB_TYPE_COLORS[job.job_type] || "bg-[#1E1E2E] text-[#6B7280] border-[#1E1E2E]"}`}>
                  {job.job_type}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#6B7280]">
              {(job.salary_min || job.salary_max) && (
                <span className="text-[#10B981] font-semibold">
                  {job.salary_min && job.salary_max
                    ? `₹${job.salary_min.toLocaleString("en-IN")} – ₹${job.salary_max.toLocaleString("en-IN")}`
                    : job.salary_min
                    ? `From ₹${job.salary_min.toLocaleString("en-IN")}`
                    : `Up to ₹${job.salary_max!.toLocaleString("en-IN")}`}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {timeAgo(job.created_at)}
              </span>
            </div>

            {job.skills_required && job.skills_required.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {job.skills_required.slice(0, 4).map(skill => (
                  <Badge key={skill} className="bg-[#4F46E5]/10 text-[#818CF8] border-[#4F46E5]/20 text-xs px-2 py-0.5">
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
  )
}
