import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Bell, Plus, Briefcase, Package, FileText, Users, Layers,
  Search, Building2, CheckCircle2, AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NoticeBanner from "@/components/notices/NoticeBanner"
import DashboardSupportButton from "@/components/support/DashboardSupportButton"
import FomoBar from "@/components/dashboard/FomoBar"
import PlanCard from "@/components/dashboard/PlanCard"
import BannerAd from "@/components/ads/BannerAd"
import { fetchAd } from "@/lib/ads"
import DashboardTabs from "@/components/dashboard/DashboardTabs"

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  open:        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  applied:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  reviewing:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  shortlisted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  interview:   "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  selected:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected:    "bg-red-500/20 text-red-400 border-red-500/30",
  pending:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed:      "bg-[#334155] text-[#94A3B8] border-[#334155]",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}
const sColor = (s: string) => STATUS_COLORS[s] ?? "bg-[#334155] text-[#94A3B8] border-[#334155]"

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-[#6B7280] text-xs mt-1">{label}</p>
    </div>
  )
}

function SectionHdr({ title, icon, href, linkLabel }: {
  title: string; icon: React.ReactNode; href?: string; linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-lg flex items-center gap-2">{icon} {title}</h2>
      {href && linkLabel && (
        <Link href={href}>
          <Button size="sm" className="bg-[#1E1E2E] hover:bg-[#2D2D3F] text-white border border-[#334155] text-xs font-bold gap-1.5">
            <Plus className="h-3.5 w-3.5" /> {linkLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}

function Empty({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 text-center">
      <p className="text-[#6B7280] text-sm mb-4">{message}</p>
      <Link href={href}>
        <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold">{cta}</Button>
      </Link>
    </div>
  )
}

function VerificationCard({ status, planActive }: { status: string | null; planActive: boolean }) {
  if (status === "approved") return null
  const isUnverified = !status || status === "unverified"
  const isPending    = status === "pending"

  const inner = (
    <div className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${
      isPending
        ? "bg-[#F59E0B]/10 border-[#F59E0B]/30"
        : "bg-[#1E1E2E] border-[#334155] hover:border-[#4F46E5]/50 cursor-pointer"
    }`}>
      {isPending
        ? <AlertCircle className="h-5 w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        : <CheckCircle2 className="h-5 w-5 text-[#4F46E5] flex-shrink-0 mt-0.5" />
      }
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">
          {isPending ? "Verification Under Review" : "Get Verified ✓"}
        </p>
        <p className="text-[#6B7280] text-xs mt-0.5">
          {isPending
            ? "Our team is reviewing your documents. You'll be notified soon."
            : isUnverified
              ? "Stand out with a verified badge — clients trust verified profiles 3× more."
              : "Verification rejected. Submit correct documents."}
        </p>
      </div>
      {!isPending && (
        <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex-shrink-0">
          Verify Now
        </Button>
      )}
    </div>
  )

  if (isPending) return inner
  return <Link href="/verify">{inner}</Link>
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const rawRoles = (profile?.user_roles as string[] | null) ?? []
  // Must have completed onboarding and have a role assigned
  if (!profile?.profile_completed || rawRoles.length === 0) redirect("/profile/complete")

  const adminDb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now    = new Date()
  const nowISO = now.toISOString()

  // ── Role resolution ──────────────────────────────────────────────────────────
  const isFindWork   = rawRoles.includes("find_work")
  const isHireTalent = rawRoles.includes("hire_talent")
  const isBoth       = isFindWork && isHireTalent
  const fwType       = profile.find_work_type as string | null   // freelancer | job_seeker | both
  const htType       = profile.hire_talent_type as string | null // individual | company
  const isFreelancer = isFindWork && fwType !== "job_seeker"
  const isJobSeeker  = isFindWork && (fwType === "job_seeker" || fwType === "both")
  const isCompany    = isHireTalent && htType === "company"

  // ── Plan status ──────────────────────────────────────────────────────────────
  const planExpiry       = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
  const findWorkActive   = profile.plan === "find_work"   && !!planExpiry && planExpiry > now
  const hireTalentActive = profile.plan === "hire_talent" && !!planExpiry && planExpiry > now
  const verificationStatus = profile.verification_status as string | null

  const firstName   = profile.full_name?.split(" ")[0] || "there"
  const connectsBal = profile.connects_balance ?? 0

  const dashboardAd = await fetchAd("dashboard", rawRoles, fwType, htType)

  // ── Parallel data fetch ──────────────────────────────────────────────────────
  const [
    { data: notifications },
    { data: myGigs },
    { data: myProposals },
    { data: myApplications },
    { data: recommendedProjects },
    { data: recommendedJobs },
    { data: myJobs },
    { data: myProjects },
    { data: activeNotices },
  ] = await Promise.all([
    supabase.from("notifications").select("id, message, body, link")
      .eq("user_id", user.id).eq("is_read", false)
      .order("created_at", { ascending: false }).limit(4),

    isFreelancer
      ? supabase.from("gigs").select("id, title, price, category, status, delivery_days")
          .eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),

    isFreelancer
      ? supabase.from("proposals").select("id, status, bid_amount, projects:project_id(id, title)")
          .eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),

    isJobSeeker
      ? supabase.from("job_applications")
          .select("id, status, created_at, job:job_id(id, title, company_name)")
          .eq("applicant_id", user.id).order("created_at", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] }),

    isFreelancer
      ? supabase.from("projects").select("id, title, description, budget, category")
          .eq("status", "open").order("created_at", { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),

    isJobSeeker
      ? supabase.from("jobs").select("id, title, company_name, job_type, location")
          .eq("status", "active").order("created_at", { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),

    isHireTalent
      ? supabase.from("jobs").select("id, title, job_type, status, application_count, created_at")
          .eq("poster_id", user.id).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),

    isHireTalent
      ? supabase.from("projects").select("id, title, budget, status, created_at")
          .eq("client_id", user.id).order("created_at", { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),

    adminDb.from("notices").select("id, title, content, type")
      .eq("is_active", true)
      .or(`show_until.is.null,show_until.gt.${nowISO}`)
      .order("created_at", { ascending: false }).limit(3),
  ])

  const unreadCount   = notifications?.length ?? 0
  const proposalCount = myProposals?.length ?? 0
  const appliedCount  = myApplications?.length ?? 0
  const receivedApps  = (myJobs as Array<{ application_count?: number }> | null)
    ?.reduce((s, j) => s + (j.application_count ?? 0), 0) ?? 0

  // ── FREELANCER VIEW ──────────────────────────────────────────────────────────
  const FreelancerContent = (
    <div className="space-y-8">
      <FomoBar type="find_work" planActive={findWorkActive} planExpiresAt={profile.plan_expires_at} findWorkType={fwType} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="My Gigs"   value={myGigs?.length ?? 0}  color="text-[#818CF8]" />
        <Stat label="Proposals" value={proposalCount}          color="text-[#8B5CF6]" />
        <Stat label="Connects"  value={connectsBal}            color="text-[#06B6D4]" />
        <Stat label="Applied"   value={proposalCount}          color="text-[#F97316]" />
      </div>

      <VerificationCard status={verificationStatus} planActive={findWorkActive} />
      {!findWorkActive && <PlanCard type="find_work" isLoggedIn={true} findWorkType={fwType} />}
      {dashboardAd && <BannerAd ad={dashboardAd} />}

      <div>
        <SectionHdr title="My Gigs" icon={<Package className="h-5 w-5 text-[#818CF8]" />} href="/gigs/new" linkLabel="New Gig" />
        {!myGigs || myGigs.length === 0
          ? <Empty message="No gigs yet. Create one to showcase your services." cta="Create Your First Gig →" href="/gigs/new" />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myGigs.map(gig => (
                <Link key={gig.id} href={`/gigs/${gig.id}`}>
                  <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#4F46E5]/40 rounded-xl p-4 transition-all h-full">
                    <p className="text-[#6B7280] text-xs capitalize mb-1">{gig.category}</p>
                    <p className="text-white font-semibold text-sm line-clamp-2 mb-3">{gig.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#818CF8] font-bold text-sm">₹{gig.price?.toLocaleString()}</span>
                      <Badge className={`border capitalize text-xs ${sColor(gig.status ?? "active")}`}>{gig.status ?? "active"}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>

      {myProposals && myProposals.length > 0 && (
        <div>
          <SectionHdr title="Applied Projects" icon={<Layers className="h-5 w-5 text-[#06B6D4]" />} />
          <div className="space-y-2">
            {(myProposals as Array<{ id: string; status: string; bid_amount: number; projects: { id?: string; title?: string } | null }>)
              .map(p => (
                <Link key={p.id} href={`/projects/${p.projects?.id ?? "#"}`}>
                  <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#06B6D4]/40 rounded-xl p-4 flex items-center justify-between transition-all">
                    <div>
                      <p className="text-white font-medium text-sm">{p.projects?.title ?? "Project"}</p>
                      <p className="text-[#6B7280] text-xs mt-0.5">Bid: ₹{p.bid_amount?.toLocaleString()}</p>
                    </div>
                    <Badge className={`border capitalize text-xs ${sColor(p.status)}`}>{p.status}</Badge>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {recommendedProjects && recommendedProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Recommended Projects</h2>
            <Link href="/projects" className="text-[#818CF8] text-xs hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedProjects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#4F46E5]/40 rounded-xl p-4 h-full transition-all">
                  <p className="text-white font-medium text-sm line-clamp-2 mb-2">{p.title}</p>
                  <p className="text-[#6B7280] text-xs line-clamp-2 mb-3">{p.description}</p>
                  <p className="text-[#06B6D4] font-bold text-sm">₹{p.budget?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1E1E2E]">
        <Link href="/gigs/new">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E1E2E] border border-[#1E1E2E] text-white font-medium gap-2">
            <Package className="h-4 w-4 text-[#818CF8]" /> Create Gig
          </Button>
        </Link>
        <Link href="/projects">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E1E2E] border border-[#1E1E2E] text-white font-medium gap-2">
            <Layers className="h-4 w-4 text-[#06B6D4]" /> Browse Projects
          </Button>
        </Link>
        <Link href="/jobs">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E1E2E] border border-[#1E1E2E] text-white font-medium gap-2">
            <Briefcase className="h-4 w-4 text-[#8B5CF6]" /> Browse Jobs
          </Button>
        </Link>
      </div>
    </div>
  )

  // ── JOB SEEKER VIEW ──────────────────────────────────────────────────────────
  const shortlisted = (myApplications as Array<{ status: string }> | null)
    ?.filter(a => ["shortlisted","interview","selected"].includes(a.status)).length ?? 0

  const JobSeekerContent = (
    <div className="space-y-8">
      <FomoBar type="find_work" planActive={findWorkActive} planExpiresAt={profile.plan_expires_at} findWorkType={fwType} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Applied"     value={appliedCount}  color="text-[#378ADD]" />
        <Stat label="Shortlisted" value={shortlisted}   color="text-[#8B5CF6]" />
        <Stat label="Connects"    value={connectsBal}   color="text-[#06B6D4]" />
        <Stat label="Profile %"   value="70%"           color="text-[#4ADE80]" />
      </div>

      <VerificationCard status={verificationStatus} planActive={findWorkActive} />
      {!findWorkActive && <PlanCard type="find_work" isLoggedIn={true} findWorkType={fwType} />}
      {dashboardAd && <BannerAd ad={dashboardAd} />}

      <div>
        <SectionHdr title="My Applications" icon={<FileText className="h-5 w-5 text-[#378ADD]" />} href="/jobs" linkLabel="Browse Jobs" />
        {!myApplications || myApplications.length === 0
          ? <Empty message="No applications yet. Start applying to your dream jobs!" cta="Browse Jobs →" href="/jobs" />
          : (
            <div className="space-y-2">
              {(myApplications as Array<{
                id: string; status: string; created_at: string
                job: { id: string; title: string; company_name?: string } | null
              }>).map(app => (
                <Link key={app.id} href={`/jobs/${app.job?.id ?? "#"}`}>
                  <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#378ADD]/40 rounded-xl p-4 flex items-center justify-between transition-all">
                    <div>
                      <p className="text-white font-medium text-sm">{app.job?.title ?? "Job"}</p>
                      <p className="text-[#6B7280] text-xs mt-0.5">
                        {app.job?.company_name && `${app.job.company_name} · `}
                        {new Date(app.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                      </p>
                    </div>
                    <Badge className={`border capitalize text-xs ${sColor(app.status)}`}>{app.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>

      {recommendedJobs && recommendedJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-[#378ADD]" /> Recommended Jobs
            </h2>
            <Link href="/jobs" className="text-[#378ADD] text-xs hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(recommendedJobs as Array<{ id: string; title: string; company_name?: string; job_type?: string; location?: string }>)
              .map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#378ADD]/40 rounded-xl p-4 h-full transition-all">
                    <p className="text-white font-medium text-sm">{job.title}</p>
                    <p className="text-[#6B7280] text-xs mt-1">{job.company_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {job.job_type && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E1E2E] text-[#6B7280] capitalize">
                          {job.job_type.replace("-"," ")}
                        </span>
                      )}
                      {job.location && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E1E2E] text-[#6B7280]">{job.location}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#1E1E2E]">
        <Link href="/jobs">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E1E2E] border border-[#1E1E2E] text-white font-medium gap-2">
            <Briefcase className="h-4 w-4 text-[#378ADD]" /> Browse All Jobs
          </Button>
        </Link>
        <Link href="/profile/edit">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E1E2E] border border-[#1E1E2E] text-white font-medium gap-2">
            <FileText className="h-4 w-4 text-[#8B5CF6]" /> Update Resume
          </Button>
        </Link>
      </div>
    </div>
  )

  // ── HIRE TALENT — determine correct view ──────────────────────────────────────
  const HireTalentContent = (
    <div className="space-y-8">
      <FomoBar type="hire_talent" planActive={hireTalentActive} planExpiresAt={hireTalentActive ? profile.plan_expires_at : null} hireTalentType={htType} />

      <div className={`grid gap-3 ${isCompany ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
        {isCompany && <Stat label="Jobs Posted"  value={myJobs?.length ?? 0}    color="text-[#F97316]" />}
        <Stat label="Projects"     value={myProjects?.length ?? 0}  color="text-[#F59E0B]" />
        <Stat label="Applications" value={receivedApps}              color="text-[#8B5CF6]" />
        <Stat label="Hired"        value={0}                         color="text-[#4ADE80]" />
      </div>

      {!hireTalentActive && <PlanCard type="hire_talent" isLoggedIn={true} hireTalentType={htType} />}
      {dashboardAd && <BannerAd ad={dashboardAd} />}

      {/* Post actions */}
      <div className={`grid gap-3 ${isCompany ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {isCompany && (
          <Link href="/jobs/new">
            <div className="bg-[#F97316]/10 border-2 border-[#F97316]/40 hover:border-[#F97316]/70 rounded-xl p-5 text-center transition-all cursor-pointer">
              <Briefcase className="h-8 w-8 text-[#F97316] mx-auto mb-2" />
              <p className="text-white font-bold">+ Post New Job</p>
              <p className="text-[#94A3B8] text-xs mt-1">Find the right candidate</p>
            </div>
          </Link>
        )}
        <Link href="/projects/new">
          <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B]/40 hover:border-[#F59E0B]/70 rounded-xl p-5 text-center transition-all cursor-pointer">
            <Layers className="h-8 w-8 text-[#F59E0B] mx-auto mb-2" />
            <p className="text-white font-bold">+ Post New Project</p>
            <p className="text-[#94A3B8] text-xs mt-1">Get proposals from freelancers</p>
          </div>
        </Link>
      </div>

      {/* My Job Posts (company only) */}
      {isCompany && (
        <div>
          <SectionHdr title="My Job Posts" icon={<Briefcase className="h-5 w-5 text-[#F97316]" />} href="/jobs/new" linkLabel="Post Job" />
          {!myJobs || myJobs.length === 0
            ? <Empty message="No jobs posted yet." cta="Post Your First Job →" href="/jobs/new" />
            : (
              <div className="space-y-2">
                {(myJobs as Array<{ id: string; title: string; job_type: string; status: string; application_count?: number }>)
                  .map(job => (
                    <Link key={job.id} href={`/dashboard/my-jobs/${job.id}/applicants`}>
                      <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#F97316]/40 rounded-xl p-4 flex items-center justify-between transition-all">
                        <div>
                          <p className="text-white font-medium text-sm">{job.title}</p>
                          <p className="text-[#6B7280] text-xs mt-0.5 capitalize">
                            {job.job_type?.replace("-"," ")} · {job.application_count ?? 0} applicants
                          </p>
                        </div>
                        <Badge className={`border capitalize text-xs ${sColor(job.status)}`}>{job.status}</Badge>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
        </div>
      )}

      {/* My Projects */}
      <div>
        <SectionHdr
          title={isCompany ? "My Projects" : "My Projects"}
          icon={<Layers className="h-5 w-5 text-[#F59E0B]" />}
          href="/projects/new" linkLabel="New Project"
        />
        {!myProjects || myProjects.length === 0
          ? <Empty message="No projects posted yet." cta="Post Your First Project →" href="/projects/new" />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(myProjects as Array<{ id: string; title: string; budget: number; status: string }>).map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <div className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#F59E0B]/40 rounded-xl p-4 transition-all">
                    <p className="text-white font-medium text-sm mb-2">{p.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#F59E0B] font-bold text-sm">₹{p.budget?.toLocaleString()}</span>
                      <Badge className={`border capitalize text-xs ${sColor(p.status)}`}>{p.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>

      <div className="pt-4 border-t border-[#1E1E2E]">
        <Link href="/freelancers">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E1E2E] border border-[#1E1E2E] text-white font-medium gap-2">
            <Users className="h-4 w-4 text-[#F59E0B]" /> Browse Freelancers
          </Button>
        </Link>
      </div>
    </div>
  )

  // ── Find Work content — route by subtype ─────────────────────────────────────
  const FindWorkFull = (
    isJobSeeker && !isFreelancer ? JobSeekerContent
    : isFreelancer && !isJobSeeker ? FreelancerContent
    : (
      /* both_fw — show combined */
      <div className="space-y-8">
        {FreelancerContent}
        <div className="border-t border-[#1E1E2E] pt-8">{JobSeekerContent}</div>
      </div>
    )
  )

  // ── Page ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Hey{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#818CF8] bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h1>
            <p className="text-[#6B7280] text-sm mt-0.5 flex items-center gap-2">
              {isFindWork && (
                <span className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  {fwType === "job_seeker" ? "Job Seeker" : fwType === "both" ? "Freelancer + Job Seeker" : "Freelancer"}
                </span>
              )}
              {isBoth && <span className="text-[#1E1E2E]">|</span>}
              {isHireTalent && (
                <span className="flex items-center gap-1">
                  {isCompany ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                  {isCompany ? "Company" : "Individual Client"}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {verificationStatus === "approved" && (
              <span className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-semibold">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
            <Link href="/notifications" className="relative">
              <Button variant="outline" size="icon" className="border-[#1E1E2E] bg-[#12121A] hover:bg-[#1E1E2E] text-white">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Notices */}
        {activeNotices && activeNotices.length > 0 && <NoticeBanner notices={activeNotices} />}

        {/* Notifications strip */}
        {notifications && notifications.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 mb-6">
            <p className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5] inline-block" /> Notifications
            </p>
            <div className="space-y-1.5">
              {(notifications as Array<{ id: string; message?: string; body?: string; link?: string }>).map(n => (
                <div key={n.id} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                  {n.link
                    ? <Link href={n.link} className="text-[#94A3B8] hover:text-white text-xs">{n.message || n.body}</Link>
                    : <p className="text-[#94A3B8] text-xs">{n.message || n.body}</p>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        {isBoth ? (
          <DashboardTabs findWorkContent={FindWorkFull} hireTalentContent={HireTalentContent} />
        ) : isFindWork ? (
          FindWorkFull
        ) : (
          HireTalentContent
        )}

        <div className="mt-8 pt-4 border-t border-[#1E1E2E]">
          <DashboardSupportButton />
        </div>
      </div>
    </div>
  )
}
