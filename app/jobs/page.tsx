import { createClient } from "@/lib/supabase/server"
import JobsClient from "@/components/jobs/JobsClient"
import BannerAd from "@/components/ads/BannerAd"
import { fetchAd } from "@/lib/ads"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Job Listings in India | GigWay",
  description: "Find full-time, part-time, remote and contract job opportunities across India. Zero commission on GigWay.",
  openGraph: {
    title: "Job Listings in India | GigWay",
    description: "India's freelance job board — full-time, remote, contract. Zero commission.",
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
      .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, created_at, is_featured, featured_until")
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

  const heading    = isJobSeeker ? "Find Your Dream Job" : isCompany ? "Jobs Board" : "Job Listings"
  const subheading = isJobSeeker
    ? "Browse thousands of job opportunities across India — apply in one click"
    : isCompany
    ? "Browse all active listings or post a new job for qualified candidates"
    : "Find full-time, part-time, and remote opportunities across India"

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Hero header */}
      <div className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border-b border-[#1E1E2E] py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">{heading}</h1>
              <p className="text-[#6B7280] text-sm mt-1 max-w-xl">{subheading}</p>
            </div>

            {/* Company: Post Job + Boost CTA */}
            {canPostJob && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href="/dashboard/jobs/boost"
                  className="border border-[#F59E0B]/40 text-[#F59E0B] font-semibold px-4 py-2 rounded-lg transition-all text-sm hover:bg-[#F59E0B]/10"
                >
                  ⚡ Boost Listing
                </Link>
                <Link
                  href="/jobs/new"
                  className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-semibold px-5 py-2 rounded-lg transition-opacity text-sm shadow-lg shadow-[#4F46E5]/20"
                >
                  + Post Job
                </Link>
              </div>
            )}
          </div>

          {/* Job seeker: featured companies strip */}
          {isJobSeeker && (
            <div className="mt-6 flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block animate-pulse" />
              New jobs added daily — featured listings are highlighted
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
