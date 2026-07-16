import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Star, TrendingUp, Zap } from "lucide-react"

// What each plan unlocks — role-specific
const PLAN_CONTENT: Record<string, {
  emoji: string
  title: string
  subtitle: string
  color: string
  textColor: string
  borderColor: string
  unlocked: { icon: string; label: string; desc: string }[]
  ctas: { label: string; href: string; primary?: boolean }[]
}> = {
  find_work_freelancer: {
    emoji: "🚀",
    title: "Find Work Plan Activated!",
    subtitle: "You're now boosted to the top of freelancer search",
    color: "from-[#4F46E5]/20 to-[#8B5CF6]/10",
    textColor: "text-[#818CF8]",
    borderColor: "border-[#4F46E5]/40",
    unlocked: [
      { icon: "🔝", label: "Top of Search",          desc: "Your profile appears before non-plan freelancers" },
      { icon: "📂", label: "Apply to Unlimited Projects", desc: "No connect limits — apply to every project you want" },
      { icon: "💼", label: "Gig Stays Visible",       desc: "Your gigs stay active and searchable for 30 days" },
      { icon: "✉️",  label: "Direct Client Messages",  desc: "Clients can message you directly from your profile" },
      { icon: "🔔", label: "Job & Project Alerts",     desc: "Get notified instantly when matching work is posted" },
    ],
    ctas: [
      { label: "Browse Projects →", href: "/projects", primary: true },
      { label: "Update My Profile", href: "/profile/edit" },
    ],
  },
  find_work_job_seeker: {
    emoji: "💼",
    title: "Job Seeker Plan Activated!",
    subtitle: "Companies can now find your profile in search",
    color: "from-[#0EA5E9]/20 to-[#38BDF8]/10",
    textColor: "text-[#38BDF8]",
    borderColor: "border-[#0EA5E9]/40",
    unlocked: [
      { icon: "🔝", label: "Top of Company Search",    desc: "Your resume shows up before non-plan job seekers" },
      { icon: "📋", label: "Apply to Unlimited Jobs",  desc: "No restrictions — apply to every job listing" },
      { icon: "🏢", label: "Resume Seen by Companies", desc: "Recruiters searching for candidates will find you" },
      { icon: "⚡", label: "Priority Application Badge", desc: "Your applications get a special badge — stand out" },
      { icon: "🔔", label: "Instant Job Alerts",        desc: "New matching jobs notify you before others see them" },
    ],
    ctas: [
      { label: "Browse Jobs →",        href: "/jobs",        primary: true },
      { label: "Update My Resume",     href: "/profile/edit" },
    ],
  },
  find_work_both: {
    emoji: "⚡",
    title: "Find Work Plan Activated!",
    subtitle: "You're boosted in both freelancer & job search",
    color: "from-[#4F46E5]/20 to-[#8B5CF6]/10",
    textColor: "text-[#818CF8]",
    borderColor: "border-[#4F46E5]/40",
    unlocked: [
      { icon: "🔝", label: "Top of All Search Results",      desc: "Boosted in both freelancer and job seeker listings" },
      { icon: "📂", label: "Apply to Unlimited Jobs & Projects", desc: "No connect limits across gigs, projects, and jobs" },
      { icon: "💼", label: "Gig Stays Visible",              desc: "Your gigs stay active and searchable for 30 days" },
      { icon: "⚡", label: "Priority Application Badge",     desc: "Job applications get a priority badge — stand out" },
      { icon: "🔔", label: "Instant Alerts for Both",        desc: "Get notified for new projects and new job openings" },
    ],
    ctas: [
      { label: "Browse Jobs →",     href: "/jobs",     primary: true },
      { label: "Browse Projects →", href: "/projects" },
    ],
  },
  hire_talent_individual: {
    emoji: "🎯",
    title: "Hire Talent Plan Activated!",
    subtitle: "Start posting projects and find India's best freelancers",
    color: "from-[#F59E0B]/20 to-[#F97316]/10",
    textColor: "text-[#F59E0B]",
    borderColor: "border-[#F59E0B]/40",
    unlocked: [
      { icon: "📝", label: "Post Unlimited Projects",         desc: "List as many projects as you need this month" },
      { icon: "🔍", label: "Browse Verified Freelancers",     desc: "Access full profiles including portfolios and reviews" },
      { icon: "✉️",  label: "Direct Message Freelancers",      desc: "Chat directly with any freelancer on the platform" },
      { icon: "✅", label: "Verified Hirer Badge",             desc: "Freelancers trust verified hirers — better proposals" },
      { icon: "📊", label: "Applicant Tracking",              desc: "Manage all proposals in one dashboard view" },
    ],
    ctas: [
      { label: "Post a Project →",       href: "/projects/new", primary: true },
      { label: "Browse Freelancers →",   href: "/freelancers" },
    ],
  },
  hire_talent_company: {
    emoji: "🏢",
    title: "Company Plan Activated!",
    subtitle: "Start hiring — post jobs & projects with full access",
    color: "from-[#F97316]/20 to-[#EF4444]/10",
    textColor: "text-[#F97316]",
    borderColor: "border-[#F97316]/40",
    unlocked: [
      { icon: "📋", label: "Post Unlimited Jobs",              desc: "No cap on job listings this month" },
      { icon: "📝", label: "Post Unlimited Projects",          desc: "Hire freelancers for short-term work too" },
      { icon: "📁", label: "Full CV Database Access",          desc: "Browse and download resumes from all job seekers" },
      { icon: "✅", label: "Verified Company Badge",           desc: "Builds trust — candidates apply faster to verified cos" },
      { icon: "⭐", label: "Featured Job Listings",            desc: "Boost any job to the top for ₹299 — more applicants" },
      { icon: "📊", label: "Applicant Tracking",              desc: "See all applications with status tracking in dashboard" },
    ],
    ctas: [
      { label: "Post a Job →",         href: "/jobs/new",  primary: true },
      { label: "Post a Project →",     href: "/projects/new" },
    ],
  },
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { plan } = await searchParams

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at, find_work_type, hire_talent_type, user_roles")
    .eq("id", user.id)
    .single()

  const roles   = (profile?.user_roles as string[] | null) ?? []
  const fwType  = profile?.find_work_type
  const htType  = profile?.hire_talent_type
  const isPlanActive = plan === "find_work_monthly" || plan === "hire_talent_monthly"

  // Derive content key from role
  let contentKey = "find_work_freelancer"
  if (plan === "hire_talent_monthly" || roles.includes("hire_talent")) {
    contentKey = htType === "individual" ? "hire_talent_individual" : "hire_talent_company"
  } else if (fwType === "job_seeker") {
    contentKey = "find_work_job_seeker"
  } else if (fwType === "both") {
    contentKey = "find_work_both"
  }

  const content = PLAN_CONTENT[contentKey]
  const expiresDate = profile?.plan_expires_at
    ? new Date(profile.plan_expires_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-start py-16 px-4">
      <div className="w-full max-w-2xl">

        {/* Success animation */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-full bg-[#4ADE80]/20 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-[#4ADE80]/20 border border-[#4ADE80]/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-[#4ADE80]" />
            </div>
          </div>
          <p className="text-5xl mb-3">{content.emoji}</p>
          <h1 className="text-3xl font-black text-white mb-2">{content.title}</h1>
          <p className="text-[#6B7280] text-sm">{content.subtitle}</p>
          {expiresDate && (
            <p className="text-[#4ADE80] text-xs mt-2 font-medium">Active until {expiresDate}</p>
          )}
        </div>

        {/* Search rank callout */}
        <div className="bg-gradient-to-r from-[#4ADE80]/10 to-[#06B6D4]/10 border border-[#4ADE80]/20 rounded-2xl p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4ADE80]/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-[#4ADE80]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">You&apos;ve moved to the top</p>
            <p className="text-[#6B7280] text-xs mt-0.5">
              {plan === "find_work_monthly"
                ? "Your profile is now boosted above non-plan members in search results for 30 days."
                : "Your listings and profile are now prioritized for matching applicants for 30 days."}
            </p>
          </div>
        </div>

        {/* Unlocked features */}
        <div className={`bg-gradient-to-br ${content.color} border ${content.borderColor} rounded-2xl p-6 mb-8`}>
          <div className="flex items-center gap-2 mb-5">
            <Star className={`h-4 w-4 ${content.textColor}`} />
            <p className={`font-bold text-sm ${content.textColor}`}>What&apos;s now unlocked for you</p>
          </div>
          <div className="space-y-4">
            {content.unlocked.map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{item.desc}</p>
                </div>
                <Zap className={`h-4 w-4 ${content.textColor} flex-shrink-0 ml-auto mt-0.5`} />
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {content.ctas.map(cta => (
            <Link
              key={cta.href}
              href={cta.href}
              className={`flex-1 text-center font-bold px-6 py-3 rounded-xl text-sm transition-opacity hover:opacity-90 ${
                cta.primary
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-lg shadow-[#4F46E5]/20"
                  : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#4F46E5]/40"
              }`}
            >
              {cta.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="flex-1 text-center font-bold px-6 py-3 rounded-xl text-sm bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#4F46E5]/40 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Not the right plan? */}
        {!isPlanActive && (
          <p className="text-center text-[#6B7280] text-xs mt-8">
            Wrong plan?{" "}
            <Link href="/pricing" className="text-[#818CF8] hover:underline">
              View all plans →
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
