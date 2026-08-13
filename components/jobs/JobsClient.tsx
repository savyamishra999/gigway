"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Search, MapPin, Clock, Star, Briefcase, CheckCircle2, ArrowRight, Globe2 } from "lucide-react"

interface JobProfile { is_verified?: boolean | null }

interface Job {
  id: string
  title: string
  company_name: string | null
  location: string | null
  job_type: string
  salary_min: number | null
  salary_max: number | null
  skills_required: string[] | null
  experience_required?: string | null
  created_at: string
  is_featured?: boolean | null
  featured_until?: string | null
  client_id?: string | null
  profiles?: JobProfile | JobProfile[] | null
}

const JOB_TYPES = [
  { value: "", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
  { value: "contract", label: "Contract" },
]

const SALARY_TIERS = [
  { value: 0,       label: "Any salary" },
  { value: 300000,  label: "₹3L+" },
  { value: 600000,  label: "₹6L+" },
  { value: 1000000, label: "₹10L+" },
  { value: 2000000, label: "₹20L+" },
]

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

function isVerifiedPoster(job: Job) {
  const p = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles
  return !!p?.is_verified
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null
  if (min && max) return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`
  if (min) return `From ₹${min.toLocaleString("en-IN")}`
  return `Up to ₹${max!.toLocaleString("en-IN")}`
}

interface Props {
  initialJobs: Job[]
  canPostJob?: boolean
  isJobSeeker?: boolean
}

export default function JobsClient({ initialJobs, canPostJob = false, isJobSeeker = false }: Props) {
  const [jobs, setJobs]           = useState<Job[]>(initialJobs)
  const [search, setSearch]       = useState("")
  const [location, setLocation]   = useState("")
  const [jobType, setJobType]     = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [minSalary, setMinSalary] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const supabase = createClient()

  const SKILL_FILTERS = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const j of initialJobs) {
      for (const sk of j.skills_required ?? []) {
        freq[sk] = (freq[sk] ?? 0) + 1
      }
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([sk]) => sk)
  }, [initialJobs])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError("")
    let query = supabase
      .from("jobs")
      .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, experience_required, created_at, is_featured, featured_until, client_id, profiles:client_id(is_verified)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (jobType) query = query.eq("job_type", jobType)
    if (location.trim()) query = query.ilike("location", `%${location.trim()}%`)
    if (minSalary > 0) query = query.gte("salary_min", minSalary)

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
      setJobs([])
      setLoading(false)
      return
    }

    let results = (data as unknown as Job[]) || []
    if (search) {
      const s = search.toLowerCase()
      results = results.filter(
        j =>
          j.title?.toLowerCase().includes(s) ||
          j.company_name?.toLowerCase().includes(s) ||
          j.skills_required?.some(sk => sk.toLowerCase().includes(s))
      )
    }
    if (skillFilter) {
      results = results.filter(j =>
        j.skills_required?.some(sk => sk.toLowerCase().includes(skillFilter.toLowerCase()))
      )
    }
    setJobs(results)
    setLoading(false)
  }, [search, location, jobType, skillFilter, minSalary]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (search || location || jobType || skillFilter || minSalary > 0) {
      fetchJobs()
    } else {
      setJobs(initialJobs)
    }
  }, [search, location, jobType, skillFilter, minSalary]) // eslint-disable-line react-hooks/exhaustive-deps

  const featuredJobs = jobs.filter(isFeaturedActive)
  const regularJobs  = jobs.filter(j => !isFeaturedActive(j))

  return (
    <>
      {/* Search + location */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-indigo" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, skills, companies..."
            className="w-full bg-white border-2 border-brand-indigo/15 focus:border-brand-indigo rounded-pill pl-11 pr-4 py-3.5 text-brand-midnight text-sm placeholder:text-brand-slate outline-none transition-all shadow-soft focus:ring-4 focus:ring-brand-indigo/10"
          />
        </div>
        <div className="relative sm:w-56">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-slate" />
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full bg-white border border-brand-borderLight focus:border-brand-indigo rounded-pill pl-11 pr-4 py-3.5 text-brand-midnight text-sm placeholder:text-brand-slate outline-none transition-all shadow-soft"
          />
        </div>
        <button
          type="button"
          onClick={() => setJobType(jobType === "remote" ? "" : "remote")}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-pill text-sm font-semibold border transition-all flex-shrink-0 ${
            jobType === "remote"
              ? "bg-brand-indigo text-white border-brand-indigo shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
              : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-indigo/40"
          }`}
        >
          <Globe2 className="h-4 w-4" /> Remote
        </button>
      </div>

      {/* Job Type Filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {JOB_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setJobType(type.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
              jobType === type.value
                ? "bg-brand-indigo text-white border-brand-indigo"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-indigo/40 hover:text-brand-midnight"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Salary Filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SALARY_TIERS.map(tier => (
          <button
            key={tier.value}
            onClick={() => setMinSalary(tier.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
              minSalary === tier.value
                ? "bg-brand-midnight text-white border-brand-midnight"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-midnight/30 hover:text-brand-midnight"
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* Skill Filters */}
      {SKILL_FILTERS.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-brand-borderLight rounded-card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-card p-10 text-center">
          <p className="text-red-600 font-semibold mb-1">Failed to load jobs</p>
          <p className="text-brand-slate text-sm">Please try again in a moment.</p>
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState canPostJob={canPostJob} isJobSeeker={isJobSeeker} />
      ) : (
        <>
          <p className="text-brand-slate text-body-sm mb-6">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
            {featuredJobs.length > 0 && (
              <span className="ml-2 text-brand-coral font-medium">· {featuredJobs.length} featured</span>
            )}
          </p>

          {/* Featured section */}
          {featuredJobs.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-brand-coral fill-brand-coral" />
                <span className="text-brand-coral text-sm font-semibold">Featured Opportunities</span>
              </div>
              <div className="space-y-4">
                {featuredJobs.map(job => <JobCard key={job.id} job={job} featured />)}
              </div>
              {regularJobs.length > 0 && (
                <div className="border-t border-brand-borderLight mt-8 mb-6 flex items-center gap-3">
                  <span className="text-brand-slate text-xs bg-brand-ivory pr-3">Latest Jobs</span>
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
            <div className="mt-10 bg-white border border-brand-coral/25 rounded-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-brand-midnight font-semibold">Get more applicants — fast</p>
                <p className="text-brand-slate text-sm mt-0.5">Boost your listing to the top of search results. Pay once, stay featured for 30 days.</p>
              </div>
              <Link
                href="/dashboard/jobs/boost"
                className="flex-shrink-0 bg-brand-coral text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-brand-coralDark transition-colors"
              >
                Boost a Listing
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
      <div className="flex flex-col items-center text-center py-20 bg-white border border-brand-borderLight rounded-card px-8">
        <Search className="h-10 w-10 text-brand-slate/40 mb-4" />
        <h3 className="text-brand-midnight font-bold text-xl mb-2">No jobs found</h3>
        <p className="text-brand-slate text-sm max-w-xs">
          No listings match your search right now. Try different keywords or check back soon — new jobs are posted daily.
        </p>
      </div>
    )
  }

  if (canPostJob) {
    return (
      <div className="flex flex-col items-center text-center py-20 bg-white border border-brand-borderLight rounded-card px-8">
        <Briefcase className="h-10 w-10 text-brand-slate/40 mb-4" />
        <h3 className="text-brand-midnight font-bold text-xl mb-2">No jobs posted yet</h3>
        <p className="text-brand-slate text-sm mb-6 max-w-xs">
          Post your first job and start receiving applications from top talent.
        </p>
        <Link
          href="/jobs/new"
          className="bg-brand-indigo text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-indigoDark transition-colors text-sm"
        >
          Post a Job →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center py-20 bg-white border border-brand-borderLight rounded-card px-8">
      <Briefcase className="h-10 w-10 text-brand-slate/40 mb-4" />
      <h3 className="text-brand-midnight font-bold text-xl mb-2">No jobs found</h3>
      <p className="text-brand-slate text-sm max-w-xs">Check back soon — new opportunities are added every day.</p>
    </div>
  )
}

function JobCard({ job, featured = false }: { job: Job; featured?: boolean }) {
  const salary = formatSalary(job.salary_min, job.salary_max)
  const verified = isVerifiedPoster(job)

  return (
    <Link href={`/jobs/${job.id}`}
      className={`group block bg-white border rounded-card p-5 transition-all hover:-translate-y-0.5 ${
        featured ? "border-brand-coral/30 shadow-soft hover:shadow-elevated" : "border-brand-borderLight shadow-soft hover:shadow-elevated hover:border-brand-indigo/30"
      }`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo font-bold text-lg flex-shrink-0">
          {(job.company_name || "C")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-brand-midnight font-bold text-body-lg group-hover:text-brand-indigo transition-colors leading-tight">
                  {job.title}
                </h3>
                {featured && (
                  <span className="flex items-center gap-1 text-brand-coral text-caption font-semibold bg-brand-coral/10 border border-brand-coral/20 px-2 py-0.5 rounded-pill flex-shrink-0">
                    <Star className="h-3 w-3 fill-brand-coral" /> Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-brand-slate text-body-sm">{job.company_name || "Company"}</p>
                {verified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo flex-shrink-0" />}
              </div>
            </div>
            {job.job_type && (
              <span className="flex-shrink-0 capitalize text-caption font-semibold px-2.5 py-1 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
                {job.job_type}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-body-sm text-brand-slate">
            {salary && <span className="text-emerald-600 font-semibold">{salary}</span>}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
            )}
            {job.experience_required && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {job.experience_required}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeAgo(job.created_at)}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 mt-3">
            {job.skills_required && job.skills_required.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {job.skills_required.slice(0, 4).map(skill => (
                  <span key={skill} className="text-caption px-2 py-0.5 rounded-pill bg-brand-ivory text-brand-slate border border-brand-borderLight">
                    {skill}
                  </span>
                ))}
                {job.skills_required.length > 4 && (
                  <span className="text-caption px-2 py-0.5 rounded-pill bg-brand-ivory text-brand-slate border border-brand-borderLight">
                    +{job.skills_required.length - 4}
                  </span>
                )}
              </div>
            ) : <span />}
            <span className="flex-shrink-0 flex items-center gap-1 text-brand-indigo text-caption font-semibold group-hover:gap-1.5 transition-all">
              View Job <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
