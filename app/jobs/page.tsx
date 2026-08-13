import { createClient } from "@/lib/supabase/server"
import JobsClient from "@/components/jobs/JobsClient"
import BannerAd from "@/components/ads/BannerAd"
import { fetchAd } from "@/lib/ads"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Jobs | GigWay",
  description: "Find full-time, part-time, remote and contract job opportunities. Zero commission on GigWay.",
  openGraph: {
    title: "Jobs | GigWay",
    description: "GigWay's global job board — full-time, remote, contract. Zero commission.",
    type: "website",
  },
}

export default async function JobsPage() {
  const supabase = await createClient()

  const [
    { data: initialJobs },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("jobs")
      .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, experience_required, created_at, is_featured, featured_until, client_id, profiles:client_id(is_verified)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  let canPostJob   = false
  let isJobSeeker  = false
  let isCompany    = false

  let roles: string[] = []
  let fwType: string | null = null
  let htType: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_roles, hire_talent_type, find_work_type")
      .eq("id", user.id)
      .single()

    roles   = (profile?.user_roles as string[] | null) ?? []
    fwType  = profile?.find_work_type ?? null
    htType  = profile?.hire_talent_type ?? null

    canPostJob  = roles.includes("hire_talent") && htType === "company"
    isCompany   = canPostJob
    isJobSeeker = roles.includes("find_work") && (fwType === "job_seeker" || fwType === "both")
  }

  const ad = await fetchAd("jobs", roles, fwType, htType)

  const subheading = isJobSeeker
    ? "Browse opportunities matched to your skills — apply in one click"
    : isCompany
    ? "Browse all active listings or post a new job for qualified candidates"
    : "Full-time, part-time, remote and contract roles from companies around the world"

  return (
    <div className="min-h-screen bg-brand-ivory">
      {/* Header */}
      <div className="bg-white border-b border-brand-borderLight py-10 sm:py-14">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-h1 font-extrabold text-brand-midnight">Find your next opportunity</h1>
              <p className="text-brand-slate text-body-sm sm:text-body-lg mt-2 max-w-xl">{subheading}</p>
            </div>

            {/* Company: Post Job + Boost CTA */}
            {canPostJob && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href="/dashboard/jobs/boost"
                  className="border border-brand-coral/40 text-brand-coral font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm hover:bg-brand-coral/5"
                >
                  Boost Listing
                </Link>
                <Link
                  href="/jobs/new"
                  className="bg-brand-indigo hover:bg-brand-indigoDark text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
                >
                  + Post Job
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {ad && <BannerAd ad={ad} className="mb-6" />}
        <JobsClient
          initialJobs={initialJobs ?? []}
          canPostJob={canPostJob}
          isJobSeeker={isJobSeeker}
        />
      </div>
    </div>
  )
}
