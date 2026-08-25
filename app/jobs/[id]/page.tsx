import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Calendar, Building2, IndianRupee, Pencil, Briefcase, CheckCircle2, Users } from "lucide-react"
import JobApplyButton from "@/components/jobs/JobApplyButton"
import DeleteButton from "@/components/ui/DeleteButton"
import type { Metadata } from "next"
import { canManageJob } from "@/lib/jobs/server"
import MarketplaceShareButton from "@/components/social/MarketplaceShareButton"

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

  if (!job) return { title: "Job Not Found | GigWay" }

  const salary = job.salary_min && job.salary_max
    ? `₹${job.salary_min.toLocaleString()} – ₹${job.salary_max.toLocaleString()}`
    : ""

  return {
    title: `${job.title} at ${job.company_name || "Company"} | GigWay Jobs`,
    description: `${job.job_type} position${job.location ? ` in ${job.location}` : ""}${salary ? `. Salary: ${salary}` : ""}. ${job.description?.slice(0, 100) ?? ""}`,
    openGraph: {
      title: `${job.title} | GigWay`,
      description: job.description?.slice(0, 200),
    },
  }
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

  const { data: organization } = job.organization_id ? await supabase.from("organizations").select("id,name,username,logo_url,entity_type,industry,tagline,location,is_verified").eq("id", job.organization_id).maybeSingle() : { data: null }

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

  const isOwner = !!user && await canManageJob(user.id, job)
  const poster = job.profiles as { id?: string; full_name?: string | null; company?: string | null; avatar_url?: string | null; is_verified?: boolean | null } | null
  const companyDisplay = organization?.name || job.company_name || poster?.company || poster?.full_name || "Company"
  const employerHref = organization?.username ? `/u/${organization.username}` : null
  const salary = job.salary_min && job.salary_max
    ? `₹${job.salary_min.toLocaleString()} – ₹${job.salary_max.toLocaleString()}`
    : job.salary_min
    ? `From ₹${job.salary_min.toLocaleString()}`
    : job.salary_max
    ? `Up to ₹${job.salary_max.toLocaleString()}`
    : null

  return (
    <div className="min-h-screen bg-brand-ivory py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Job Header */}
            <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-brand-indigo/10 flex items-center justify-center overflow-hidden text-brand-indigo font-bold text-2xl flex-shrink-0">
                  {organization?.logo_url ? <img src={organization.logo_url} alt="" className="h-full w-full object-cover" /> : companyDisplay[0]?.toUpperCase() || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-h2 font-extrabold text-brand-midnight mb-1">{job.title}</h1>
                  <div className="flex items-center gap-1.5">
                    {employerHref ? <Link href={employerHref} className="text-brand-slate hover:text-brand-indigo">{companyDisplay}</Link> : <p className="text-brand-slate">{companyDisplay}</p>}
                    {(organization?.is_verified || poster?.is_verified) && <CheckCircle2 className="h-4 w-4 text-brand-indigo flex-shrink-0" />}
                    {organization && <span className="text-caption font-bold text-brand-slate">{organization.entity_type === "company" ? "Company" : "Organization"}</span>}
                  </div>
                </div>
                {job.job_type && (
                  <span className="flex-shrink-0 capitalize text-caption font-semibold px-3 py-1.5 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
                    {job.job_type}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-slate">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </span>
                )}
                {salary && (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <IndianRupee className="h-4 w-4" /> {salary}
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
                <span className="flex items-center gap-1.5 text-brand-slate/80">
                  <Users className="h-4 w-4" /> {applicantCount || 0} applicant{applicantCount === 1 ? "" : "s"}
                </span>
              </div>
              {user && <div className="mt-4"><MarketplaceShareButton objectType="job" objectId={id} isOwner={isOwner} /></div>}
            </div>

            {/* Description */}
            <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
              <h2 className="text-brand-midnight font-bold text-h3 mb-4">Job Description</h2>
              <div className="text-brand-slate leading-relaxed whitespace-pre-wrap text-sm">
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                <h2 className="text-brand-midnight font-bold text-h3 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {job.experience_required && (
              <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                <h2 className="text-brand-midnight font-bold text-h3 mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-indigo" /> Experience Required
                </h2>
                <p className="text-brand-slate text-sm">{job.experience_required}</p>
              </div>
            )}

            {/* Apply Section */}
            <div>
              {!user && (
                <div className="bg-white border border-brand-borderLight rounded-card p-6 text-center shadow-soft">
                  <p className="text-brand-slate mb-4">Sign in to apply for this job</p>
                  <Link href="/login">
                    <Button className="bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold">
                      Sign In to Apply
                    </Button>
                  </Link>
                </div>
              )}

              {user && hasApplied && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-card p-6 text-center">
                  <p className="text-emerald-700 font-semibold">You have already applied for this job.</p>
                </div>
              )}

              {user && !hasApplied && !isOwner && (
                <JobApplyButton jobId={id} userId={user.id} jobTitle={job.title} />
              )}

              {user && isOwner && (
                <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                  <p className="text-brand-slate mb-4">You posted this job. {applicantCount || 0} applicant{applicantCount === 1 ? "" : "s"} so far.</p>
                  <div className="flex gap-3">
                    <Link href={`/jobs/${id}/edit`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-borderLight text-brand-indigo hover:bg-brand-indigo/5 text-sm font-semibold transition-colors">
                      <Pencil className="h-4 w-4" /> Edit Job
                    </Link>
                    <DeleteButton table="jobs" id={id} redirectTo="/jobs" label="Delete" endpoint={`/api/jobs/${id}`} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* About Company */}
            <div className="bg-white border border-brand-borderLight rounded-card p-5 shadow-soft">
              <h2 className="text-brand-midnight font-bold mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-indigo" /> About the Company
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-indigo/10 flex items-center justify-center overflow-hidden text-brand-indigo font-bold flex-shrink-0">
                  {organization?.logo_url ? <img src={organization.logo_url} alt="" className="h-full w-full object-cover" /> : companyDisplay[0]?.toUpperCase() || "C"}
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  {employerHref ? <Link href={employerHref} className="text-brand-midnight font-medium text-sm truncate hover:text-brand-indigo">{companyDisplay}</Link> : <p className="text-brand-midnight font-medium text-sm truncate">{companyDisplay}</p>}
                  {(organization?.is_verified || poster?.is_verified) && <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo flex-shrink-0" />}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white border border-brand-borderLight rounded-card p-5 shadow-soft space-y-3">
              <h2 className="text-brand-midnight font-bold mb-1">Job Details</h2>
              {job.job_type && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-slate">Type</span>
                  <span className="text-brand-midnight capitalize font-medium">{job.job_type}</span>
                </div>
              )}
              {job.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-slate">Category</span>
                  <span className="text-brand-midnight capitalize font-medium">{job.category}</span>
                </div>
              )}
              {job.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-slate">Location</span>
                  <span className="text-brand-midnight font-medium">{job.location}</span>
                </div>
              )}
              {job.deadline && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-slate">Apply by</span>
                  <span className="text-brand-midnight font-medium">{new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
