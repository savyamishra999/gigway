import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, Building2, DollarSign } from "lucide-react"
import JobApplyButton from "@/components/jobs/JobApplyButton"
import type { Metadata } from "next"

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: job } = await supabase
    .from("jobs")
    .select("title, description, company_name, location, job_type, salary_min, salary_max")
    .eq("id", id)
    .single()

  if (!job) return { title: "Job Not Found | GigWAY" }

  const salary = job.salary_min && job.salary_max
    ? `₹${job.salary_min.toLocaleString()} – ₹${job.salary_max.toLocaleString()}`
    : ""

  return {
    title: `${job.title} at ${job.company_name || "Company"} | GigWAY Jobs`,
    description: `${job.job_type} position${job.location ? ` in ${job.location}` : ""}${salary ? `. Salary: ${salary}` : ""}. ${job.description?.slice(0, 100) ?? ""}`,
    openGraph: {
      title: `${job.title} | GigWAY`,
      description: job.description?.slice(0, 200),
    },
  }
}

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-500/20 text-green-400 border-green-500/30",
  "part-time": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "internship": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "remote": "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30",
  "contract": "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

export default async function JobDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from("jobs")
    .select("*, profiles:client_id(id, full_name, company, avatar_url, is_verified)")
    .eq("id", id)
    .single()

  if (!job) return notFound()

  let hasApplied = false
  if (user) {
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", id)
      .eq("applicant_id", user.id)
      .single()
    hasApplied = !!existing
  }

  const { count: applicantCount } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", id)

  const isOwner = user?.id === job.client_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-2xl flex-shrink-0">
                  {(job.company_name || (job.profiles as { full_name?: string } | null)?.full_name || "C")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
                  <p className="text-gray-400">
                    {job.company_name || (job.profiles as { company?: string; full_name?: string } | null)?.company || (job.profiles as { full_name?: string } | null)?.full_name}
                  </p>
                </div>
                {job.job_type && (
                  <Badge className={`border capitalize flex-shrink-0 ${JOB_TYPE_COLORS[job.job_type] || "bg-white/5 text-gray-400 border-white/10"}`}>
                    {job.job_type}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </span>
                )}
                {(job.salary_min || job.salary_max) && (
                  <span className="flex items-center gap-1.5 text-[#FFD700] font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {job.salary_min && job.salary_max
                      ? `₹${job.salary_min.toLocaleString()} – ₹${job.salary_max.toLocaleString()}`
                      : job.salary_min
                      ? `From ₹${job.salary_min.toLocaleString()}`
                      : `Up to ₹${job.salary_max!.toLocaleString()}`}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {timeAgo(job.created_at)}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                )}
                <span className="text-gray-500">{applicantCount || 0} applicants</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">Job Description</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30 px-3 py-1"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {job.experience_required && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-2">Experience Required</h2>
                <p className="text-gray-300 text-sm">{job.experience_required}</p>
              </div>
            )}

            {/* Apply Section */}
            <div>
              {!user && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 mb-4">Sign in to apply for this job</p>
                  <Link href="/login">
                    <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold">
                      Sign In to Apply
                    </Button>
                  </Link>
                </div>
              )}

              {user && hasApplied && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                  <p className="text-green-400 font-semibold">You have already applied for this job.</p>
                </div>
              )}

              {user && !hasApplied && !isOwner && (
                <JobApplyButton jobId={id} userId={user.id} jobTitle={job.title} />
              )}

              {user && isOwner && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400">You posted this job. {applicantCount || 0} applicants so far.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* About Company */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#FFD700]" /> About the Company
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold">
                  {(job.company_name || (job.profiles as { full_name?: string } | null)?.full_name || "C")[0].toUpperCase()}
                </div>
                <p className="text-white font-medium text-sm">
                  {job.company_name || (job.profiles as { company?: string; full_name?: string } | null)?.company || (job.profiles as { full_name?: string } | null)?.full_name || "Company"}
                </p>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <h2 className="text-white font-semibold mb-4">Job Details</h2>
              {job.job_type && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white capitalize">{job.job_type}</span>
                </div>
              )}
              {job.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Category</span>
                  <span className="text-white capitalize">{job.category}</span>
                </div>
              )}
              {job.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white">{job.location}</span>
                </div>
              )}
              {job.deadline && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Apply by</span>
                  <span className="text-white">{new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
