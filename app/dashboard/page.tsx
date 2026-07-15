import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bell, Plus, Briefcase, Package, FileText, Users, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NoticeBanner from "@/components/notices/NoticeBanner"
import DashboardSupportButton from "@/components/support/DashboardSupportButton"
import FomoBar from "@/components/dashboard/FomoBar"
import PlanCard from "@/components/dashboard/PlanCard"
import DashboardTabs from "@/components/dashboard/DashboardTabs"

// ── Status badge colors ───────────────────────────────────────────────────────
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
}

function statusBadge(status: string) {
  return STATUS_COLORS[status] ?? "bg-[#334155] text-[#94A3B8] border-[#334155]"
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-4 text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-[#64748B] text-xs mt-1">{label}</p>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  title, icon, href, linkLabel,
}: {
  title: string
  icon: React.ReactNode
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[#F8FAFC] font-bold text-lg flex items-center gap-2">
        {icon} {title}
      </h2>
      {href && linkLabel && (
        <Link href={href}>
          <Button size="sm" className="bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] text-xs font-bold gap-1.5">
            <Plus className="h-3.5 w-3.5" /> {linkLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-8 text-center">
      <p className="text-[#64748B] text-sm mb-4">{message}</p>
      <Link href={href}>
        <Button size="sm" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold">
          {cta}
        </Button>
      </Link>
    </div>
  )
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

  if (!profile?.profile_completed) redirect("/profile/complete")

  const now = new Date()
  const nowISO = now.toISOString()

  // ── Role detection ──────────────────────────────────────────────────────────
  const rawRoles = (profile.user_roles as string[] | null) ?? []
  const isFindWork   = rawRoles.includes("find_work") || rawRoles.length === 0
  const isHireTalent = rawRoles.includes("hire_talent")
  const isBoth       = isFindWork && isHireTalent

  // ── Plan status ─────────────────────────────────────────────────────────────
  const planExpiry     = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
  const findWorkActive = profile.plan === "find_work"   && !!planExpiry && planExpiry > now
  const hireTalentActive = profile.plan === "hire_talent" && !!planExpiry && planExpiry > now

  const firstName = profile.full_name?.split(" ")[0] || "there"

  const adminDb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Parallel data fetch ─────────────────────────────────────────────────────
  const [
    { data: notifications },
    { data: myGigs },
    { data: myProposals },
    { data: myApplications },
    { data: recommendedProjects },
    { data: myJobs },
    { data: myProjects },
    { data: activeNotices },
  ] = await Promise.all([
    supabase.from("notifications").select("id, message, body, link")
      .eq("user_id", user.id).eq("is_read", false)
      .order("created_at", { ascending: false }).limit(4),

    isFindWork
      ? supabase.from("gigs").select("id, title, price, category, status, delivery_days")
          .eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),

    isFindWork
      ? supabase.from("proposals").select("id, status, bid_amount, projects:project_id(id, title)")
          .eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),

    isFindWork
      ? supabase.from("job_applications")
          .select("id, status, created_at, job:job_id(id, title)")
          .eq("applicant_id", user.id).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),

    isFindWork
      ? supabase.from("projects").select("id, title, description, budget, category")
          .eq("status", "open").order("created_at", { ascending: false }).limit(4)
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

  const unreadCount       = notifications?.length ?? 0
  const connectsBal       = profile.connects_balance ?? 0
  const appliedCount      = myApplications?.length ?? 0
  const proposalCount     = myProposals?.length ?? 0
  const totalApplied      = appliedCount + proposalCount
  const receivedAppsTotal = (myJobs as Array<{ application_count?: number }> | null)
    ?.reduce((sum, j) => sum + (j.application_count ?? 0), 0) ?? 0

  // ── FIND WORK section ──────────────────────────────────────────────────────
  const FindWorkContent = (
    <div className="space-y-8">
      <FomoBar
        type="find_work"
        planActive={findWorkActive}
        planExpiresAt={profile.plan_expires_at}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="My Gigs"    value={myGigs?.length ?? 0}   color="text-[#6366F1]" />
        <StatCard label="Applied"    value={totalApplied}           color="text-[#8B5CF6]" />
        <StatCard label="Connects"   value={connectsBal}            color="text-[#06B6D4]" />
        <StatCard label="Proposals"  value={proposalCount}          color="text-[#F97316]" />
      </div>

      {/* Payment card (if no plan) */}
      {!findWorkActive && (
        <PlanCard type="find_work" isLoggedIn={true} />
      )}

      {/* My Gigs */}
      <div>
        <SectionHeader
          title="My Gigs"
          icon={<Package className="h-5 w-5 text-[#6366F1]" />}
          href="/gigs/new"
          linkLabel="New Gig"
        />
        {!myGigs || myGigs.length === 0 ? (
          <EmptyState
            message="No gigs yet. Create one to showcase your services."
            cta="Create Your First Gig →"
            href="/gigs/new"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myGigs.map(gig => (
              <Link key={gig.id} href={`/gigs/${gig.id}`}>
                <div className="bg-[#12121A] border border-[#1E293B] hover:border-[#6366F1]/40 rounded-xl p-4 transition-all h-full">
                  <p className="text-[#64748B] text-xs capitalize mb-1">{gig.category}</p>
                  <p className="text-[#F8FAFC] font-semibold text-sm line-clamp-2 mb-3">{gig.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6366F1] font-bold text-sm">₹{gig.price?.toLocaleString()}</span>
                    <Badge className={`border capitalize text-xs ${statusBadge(gig.status ?? "active")}`}>
                      {gig.status ?? "active"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Applications (job_applications) */}
      {myApplications && myApplications.length > 0 && (
        <div>
          <SectionHeader
            title="My Applications"
            icon={<FileText className="h-5 w-5 text-[#8B5CF6]" />}
            href="/dashboard/applications"
          />
          <div className="space-y-2">
            {(myApplications as Array<{
              id: string
              status: string
              created_at: string
              job: { id: string; title: string } | null
            }>).map(app => (
              <Link key={app.id} href={`/jobs/${app.job?.id ?? "#"}`}>
                <div className="bg-[#12121A] border border-[#1E293B] hover:border-[#8B5CF6]/40 rounded-xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="text-[#F8FAFC] font-medium text-sm">{app.job?.title ?? "Job"}</p>
                    <p className="text-[#64748B] text-xs mt-0.5">
                      {new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Badge className={`border capitalize text-xs ${statusBadge(app.status)}`}>
                    {app.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Applied Projects (proposals) */}
      {myProposals && myProposals.length > 0 && (
        <div>
          <SectionHeader
            title="Applied Projects"
            icon={<Layers className="h-5 w-5 text-[#06B6D4]" />}
          />
          <div className="space-y-2">
            {(myProposals as Array<{
              id: string
              status: string
              bid_amount: number
              projects: { id?: string; title?: string } | null
            }>).map(p => (
              <Link key={p.id} href={`/projects/${p.projects?.id ?? "#"}`}>
                <div className="bg-[#12121A] border border-[#1E293B] hover:border-[#06B6D4]/40 rounded-xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="text-[#F8FAFC] font-medium text-sm">{p.projects?.title ?? "Project"}</p>
                    <p className="text-[#64748B] text-xs mt-0.5">Bid: ₹{p.bid_amount?.toLocaleString()}</p>
                  </div>
                  <Badge className={`border capitalize text-xs ${statusBadge(p.status)}`}>
                    {p.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Projects */}
      {recommendedProjects && recommendedProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#F8FAFC] font-bold text-lg">Recommended Projects</h2>
            <Link href="/projects" className="text-[#A5B4FC] text-xs hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedProjects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-[#12121A] border border-[#1E293B] hover:border-[#6366F1]/40 rounded-xl p-4 h-full transition-all">
                  <p className="text-[#F8FAFC] font-medium text-sm line-clamp-2 mb-2">{p.title}</p>
                  <p className="text-[#64748B] text-xs line-clamp-2 mb-3">{p.description}</p>
                  <p className="text-[#06B6D4] font-bold text-sm">₹{p.budget?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1E293B]">
        <Link href="/gigs/new">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E293B] border border-[#1E293B] text-[#F8FAFC] font-medium gap-2">
            <Package className="h-4 w-4 text-[#6366F1]" /> Create Gig
          </Button>
        </Link>
        <Link href="/projects">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E293B] border border-[#1E293B] text-[#F8FAFC] font-medium gap-2">
            <Layers className="h-4 w-4 text-[#06B6D4]" /> Browse Projects
          </Button>
        </Link>
        <Link href="/jobs">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E293B] border border-[#1E293B] text-[#F8FAFC] font-medium gap-2">
            <Briefcase className="h-4 w-4 text-[#8B5CF6]" /> Browse Jobs
          </Button>
        </Link>
      </div>
    </div>
  )

  // ── HIRE TALENT section ────────────────────────────────────────────────────
  const HireTalentContent = (
    <div className="space-y-8">
      <FomoBar
        type="hire_talent"
        planActive={hireTalentActive}
        planExpiresAt={hireTalentActive ? profile.plan_expires_at : null}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Jobs Posted"   value={myJobs?.length ?? 0}     color="text-[#F59E0B]" />
        <StatCard label="Projects"      value={myProjects?.length ?? 0}  color="text-[#F97316]" />
        <StatCard label="Applications"  value={receivedAppsTotal}         color="text-[#8B5CF6]" />
        <StatCard label="Hired"         value={0}                         color="text-[#4ADE80]" />
      </div>

      {/* Payment card (if no plan) */}
      {!hireTalentActive && (
        <PlanCard type="hire_talent" isLoggedIn={true} />
      )}

      {/* Post actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/jobs/new">
          <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B]/40 hover:border-[#F59E0B]/70 rounded-xl p-5 text-center transition-all cursor-pointer">
            <Briefcase className="h-8 w-8 text-[#F59E0B] mx-auto mb-2" />
            <p className="text-white font-bold">+ Post New Job</p>
            <p className="text-[#94A3B8] text-xs mt-1">Find the right candidate</p>
          </div>
        </Link>
        <Link href="/projects/new">
          <div className="bg-[#F97316]/10 border-2 border-[#F97316]/40 hover:border-[#F97316]/70 rounded-xl p-5 text-center transition-all cursor-pointer">
            <Layers className="h-8 w-8 text-[#F97316] mx-auto mb-2" />
            <p className="text-white font-bold">+ Post New Project</p>
            <p className="text-[#94A3B8] text-xs mt-1">Get proposals from freelancers</p>
          </div>
        </Link>
      </div>

      {/* My Jobs */}
      <div>
        <SectionHeader
          title="My Job Posts"
          icon={<Briefcase className="h-5 w-5 text-[#F59E0B]" />}
          href="/jobs/new"
          linkLabel="Post Job"
        />
        {!myJobs || myJobs.length === 0 ? (
          <EmptyState
            message="No jobs posted yet. Post a job to find the right talent."
            cta="Post Your First Job →"
            href="/jobs/new"
          />
        ) : (
          <div className="space-y-2">
            {(myJobs as Array<{
              id: string
              title: string
              job_type: string
              status: string
              application_count?: number
            }>).map(job => (
              <Link key={job.id} href={`/dashboard/my-jobs/${job.id}/applicants`}>
                <div className="bg-[#12121A] border border-[#1E293B] hover:border-[#F59E0B]/40 rounded-xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="text-[#F8FAFC] font-medium text-sm">{job.title}</p>
                    <p className="text-[#64748B] text-xs mt-0.5 capitalize">
                      {job.job_type?.replace("-", " ")} · {job.application_count ?? 0} applicants
                    </p>
                  </div>
                  <Badge className={`border capitalize text-xs ${statusBadge(job.status)}`}>
                    {job.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Projects */}
      {myProjects && myProjects.length > 0 && (
        <div>
          <SectionHeader
            title="My Projects"
            icon={<Layers className="h-5 w-5 text-[#F97316]" />}
            href="/projects/new"
            linkLabel="New Project"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(myProjects as Array<{
              id: string
              title: string
              budget: number
              status: string
            }>).map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-[#12121A] border border-[#1E293B] hover:border-[#F97316]/40 rounded-xl p-4 transition-all">
                  <p className="text-[#F8FAFC] font-medium text-sm mb-2">{p.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#F97316] font-bold text-sm">₹{p.budget?.toLocaleString()}</span>
                    <Badge className={`border capitalize text-xs ${statusBadge(p.status)}`}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse freelancers */}
      <div className="pt-4 border-t border-[#1E293B]">
        <Link href="/freelancers">
          <Button className="w-full bg-[#12121A] hover:bg-[#1E293B] border border-[#1E293B] text-[#F8FAFC] font-medium gap-2">
            <Users className="h-4 w-4 text-[#F59E0B]" /> Browse Freelancers
          </Button>
        </Link>
      </div>
    </div>
  )

  // ── PAGE RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">
              Hey{" "}
              <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h1>
            <p className="text-[#64748B] text-sm mt-0.5">
              {isBoth ? "You have both Find Work & Hire Talent roles"
                : isFindWork ? "Find Work dashboard"
                : "Hire Talent dashboard"}
            </p>
          </div>
          <Link href="/notifications" className="relative flex-shrink-0">
            <Button variant="outline" size="icon" className="border-[#1E293B] bg-[#12121A] hover:bg-[#1E293B]">
              <Bell className="h-5 w-5 text-[#F8FAFC]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6366F1] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Notices */}
        {activeNotices && activeNotices.length > 0 && (
          <NoticeBanner notices={activeNotices} />
        )}

        {/* Notifications strip */}
        {notifications && notifications.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-4 mb-6">
            <p className="text-[#F8FAFC] font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6366F1] inline-block" />
              Notifications
            </p>
            <div className="space-y-1.5">
              {notifications.map((n: { id: string; message?: string; body?: string; link?: string }) => (
                <div key={n.id} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-1.5 flex-shrink-0" />
                  {n.link ? (
                    <Link href={n.link} className="text-[#94A3B8] hover:text-white transition-colors text-xs">
                      {n.message || n.body}
                    </Link>
                  ) : (
                    <p className="text-[#94A3B8] text-xs">{n.message || n.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content — role based */}
        {isBoth ? (
          <DashboardTabs
            findWorkContent={FindWorkContent}
            hireTalentContent={HireTalentContent}
          />
        ) : isFindWork ? (
          FindWorkContent
        ) : (
          HireTalentContent
        )}

        {/* Support */}
        <div className="mt-8 pt-4 border-t border-[#1E293B]">
          <DashboardSupportButton />
        </div>
      </div>
    </div>
  )
}
