import { createClient } from "@/lib/supabase/server"
import JobsClient from "@/components/jobs/JobsClient"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Job Listings in India | GigWay",
  description: "Find full-time, part-time, remote and contract job opportunities across India. Post jobs for free on GigWay.",
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
      .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.auth.getUser(),
  ])

  // Only company users (hire_talent + hire_talent_type=company) can post jobs
  let canPostJob = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_roles, hire_talent_type")
      .eq("id", user.id)
      .single()
    const roles = (profile?.user_roles as string[] | null) ?? []
    canPostJob = roles.includes("hire_talent") && profile?.hire_talent_type === "company"
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Job Listings</h1>
            <p className="text-[#6B7280] text-sm mt-1">Find full-time, part-time, and remote opportunities across India</p>
          </div>
          {canPostJob && (
            <Link
              href="/jobs/new"
              className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-semibold px-5 py-2 rounded-lg transition-opacity text-sm shadow-lg shadow-[#4F46E5]/20"
            >
              + Post Job
            </Link>
          )}
        </div>

        <JobsClient initialJobs={initialJobs ?? []} />
      </div>
    </div>
  )
}
