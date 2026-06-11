import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Briefcase, Star, Package } from "lucide-react"
import BoostProfileCard from "@/components/boost/BoostProfileCard"
import VerifiedBadgeCard from "@/components/verify/VerifiedBadgeCard"
import NoticeBanner from "@/components/notices/NoticeBanner"
import DashboardSupportButton from "@/components/support/DashboardSupportButton"

const PROPOSAL_STATUS: Record<string, string> = {
  pending:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}

// ── Connects progress bar ──────────────────────────────────────────────────
function ConnectsCard({ balance }: { balance: number }) {
  const DISPLAY_MAX = 20           // full bar = 20 connects
  const pct = Math.min(100, Math.round((balance / DISPLAY_MAX) * 100))
  const isEmpty = balance === 0
  const isLow   = balance > 0 && balance <= 5

  const barColor = isEmpty ? "bg-red-500"
    : isLow ? "bg-orange-400"
    : "bg-[#4ADE80]"

  const borderColor = isEmpty ? "border-red-500/40"
    : isLow ? "border-orange-400/40"
    : "border-[#1E1E2E]"

  const label = isEmpty ? "text-red-400"
    : isLow ? "text-orange-400"
    : "text-[#4ADE80]"

  return (
    <div className={`bg-[#12121A] border ${borderColor} rounded-2xl p-5 mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <p className="text-white font-bold text-sm">Connects</p>
        </div>
        <span className={`${label} font-black text-lg`}>{balance}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-[#1E1E2E] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs mb-4 ${label}`}>
        {isEmpty ? "0 connects left — you can't apply to projects!"
          : isLow ? `Only ${balance} connects left — running low`
          : `${balance} connects remaining`}
      </p>

      {/* Zero-connects popup CTA */}
      {isEmpty && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-3 text-center">
          <p className="text-red-300 font-semibold text-sm mb-3">
            You&apos;re out of connects!<br />
            <span className="text-[#94A3B8] font-normal text-xs">Buy connects to apply to more projects.</span>
          </p>
          <Link href="/pricing#connects">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white font-black text-sm shadow-lg shadow-[#F97316]/20 hover:opacity-90 transition-opacity">
              Buy 20 for ₹99 →
            </button>
          </Link>
        </div>
      )}

      {/* Low-connects warning CTA */}
      {isLow && !isEmpty && (
        <Link href="/pricing#connects">
          <button className="w-full py-2.5 rounded-xl bg-orange-400/10 border border-orange-400/30 text-orange-300 font-bold text-sm hover:bg-orange-400/20 transition-colors">
            Buy More Connects →
          </button>
        </Link>
      )}

      {/* Normal state */}
      {!isEmpty && !isLow && (
        <div className="flex items-center justify-between">
          <p className="text-[#6B7280] text-xs">Each project application = 2 connects</p>
          <Link href="/pricing#connects" className="text-[#4ADE80] text-xs font-semibold hover:underline">
            Buy more →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Profile completion score ──────────────────────────────────────────────
interface CompletionItem {
  done: boolean
  label: string
  cta: string
  href: string
  pct: number
  icon: string
}

function ProfileCompletionCard({
  items,
  totalPct,
}: {
  items: CompletionItem[]
  totalPct: number
}) {
  if (totalPct === 100) return null   // fully complete — hide the card

  const incomplete = items.filter(i => !i.done)

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-bold text-sm">Profile Strength</p>
        <span className={`font-black text-base ${
          totalPct >= 80 ? "text-[#4ADE80]"
          : totalPct >= 50 ? "text-orange-400"
          : "text-red-400"
        }`}>{totalPct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-[#1E1E2E] rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${
            totalPct >= 80 ? "bg-[#4ADE80]"
            : totalPct >= 50 ? "bg-orange-400"
            : "bg-red-400"
          }`}
          style={{ width: `${totalPct}%` }}
        />
      </div>

      {/* Incomplete items — up to 3 shown */}
      <div className="space-y-2">
        {incomplete.slice(0, 3).map(item => (
          <Link key={item.label} href={item.href}>
            <div className="flex items-center justify-between bg-[#1E1E2E] hover:bg-[#252535] rounded-xl px-4 py-2.5 transition-colors group">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{item.icon}</span>
                <div>
                  <p className="text-[#CBD5E1] text-xs font-medium">{item.cta}</p>
                </div>
              </div>
              <span className="text-[#4ADE80] text-xs font-bold bg-[#4ADE80]/10 px-2 py-0.5 rounded-full">
                +{item.pct}%
              </span>
            </div>
          </Link>
        ))}
      </div>
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

  if (!profile?.profile_completed) redirect("/onboarding")

  const firstName = profile.full_name?.split(" ")[0] || "there"
  const now = new Date().toISOString()

  const adminDb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: notifications },
    { data: myGigs },
    { data: myJobs },
    { data: myProposals },
    { data: openProjects },
    { count: boostedCount },
    { data: activeNotices },
  ] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false)
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("gigs").select("id, title, price, category, delivery_days, rating, status")
      .eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("jobs").select("id, title, job_type, status, created_at")
      .eq("poster_id", user.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("proposals").select("id, status, bid_amount, created_at, projects:project_id(id, title)")
      .eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("projects").select("id, title, description, budget, category, status")
      .eq("status", "open").order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .eq("is_boosted", true).gt("boost_expires_at", now),
    adminDb.from("notices")
      .select("id, title, content, type")
      .eq("is_active", true)
      .or(`show_until.is.null,show_until.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(3),
  ])

  const hasGigs      = (myGigs?.length ?? 0) > 0
  const hasJobs      = (myJobs?.length ?? 0) > 0
  const hasProposals = (myProposals?.length ?? 0) > 0
  const unreadCount  = notifications?.length ?? 0
  const connectsBal  = profile.connects_balance ?? 0

  // ── Profile completion score ─────────────────────────────────────────────
  const completionItems: CompletionItem[] = [
    {
      done:  !!profile.full_name,
      label: "Full Name",
      cta:   "Add your full name",
      href:  "/profile/edit",
      pct:   15,
      icon:  "✏️",
    },
    {
      done:  !!profile.avatar_url,
      label: "Photo",
      cta:   "Add a profile photo",
      href:  "/profile/edit",
      pct:   15,
      icon:  "📸",
    },
    {
      done:  !!profile.bio,
      label: "Bio",
      cta:   "Write a short bio",
      href:  "/profile/edit",
      pct:   15,
      icon:  "📝",
    },
    {
      done:  ((profile.skills as string[] | null)?.length ?? 0) > 0,
      label: "Skills",
      cta:   "Add your skills",
      href:  "/profile/edit",
      pct:   15,
      icon:  "🛠️",
    },
    {
      done:  !!profile.phone,
      label: "Phone",
      cta:   "Add phone number → +10%",
      href:  "/profile/edit",
      pct:   10,
      icon:  "📱",
    },
    {
      done:  !!profile.is_verified,
      label: "Verified",
      cta:   "Get verified → Unlock premium clients",
      href:  "/pricing",
      pct:   15,
      icon:  "✅",
    },
    {
      done:  hasGigs,
      label: "First Gig",
      cta:   "Create your first gig",
      href:  "/gigs/new",
      pct:   15,
      icon:  "🚀",
    },
  ]

  const totalPct = completionItems
    .filter(i => i.done)
    .reduce((sum, i) => sum + i.pct, 0)

  // isProfileReady threshold: 60%+ (was 80%)
  const isProfileReady = totalPct >= 60
  const isActiveBoosted = !!(
    profile.is_boosted &&
    profile.boost_expires_at &&
    new Date(profile.boost_expires_at) > new Date()
  )

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#F8FAFC]">
              Hey{" "}
              <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h1>
            <p className="text-[#94A3B8] mt-1">
              {totalPct < 60 ? "Complete your profile to start landing projects" : "Here's what's happening on GigWAY"}
            </p>
          </div>
          <Link href="/notifications" className="relative">
            <Button variant="outline" size="icon" className="border-[#334155] bg-[#1E293B] hover:bg-[#334155]">
              <Bell className="h-5 w-5 text-[#F8FAFC]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#6366F1] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* ── GigWay Notices ────────────────────────────────────── */}
        {activeNotices && activeNotices.length > 0 && (
          <NoticeBanner notices={activeNotices} />
        )}

        {/* ── Connects gamification card ─────────────────────────── */}
        <ConnectsCard balance={connectsBal} />

        {/* ── Profile completion score ───────────────────────────── */}
        <ProfileCompletionCard items={completionItems} totalPct={totalPct} />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#6366F1]">{myProposals?.length ?? 0}</p>
            <p className="text-[#94A3B8] text-sm mt-1">Proposals Sent</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#8B5CF6]">{myGigs?.length ?? 0}</p>
            <p className="text-[#94A3B8] text-sm mt-1">Gigs Created</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#06B6D4]">{connectsBal}</p>
            <p className="text-[#94A3B8] text-sm mt-1">Connects</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#F8FAFC]">
              {profile.avg_rating ? profile.avg_rating.toFixed(1) : "—"}
            </p>
            <p className="text-[#94A3B8] text-sm mt-1">Avg Rating</p>
          </div>
        </div>

        {/* Revenue cards: Boost + Verified Badge */}
        {isProfileReady && (
          <div className="mb-6 space-y-4">
            <BoostProfileCard
              isAlreadyBoosted={isActiveBoosted}
              boostPlan={profile.boost_plan as string | null}
              boostExpiresAt={profile.boost_expires_at as string | null}
              boostedCount={boostedCount ?? 0}
            />
            <VerifiedBadgeCard
              verificationStatus={profile.verification_status as string | null}
              isVerified={profile.is_verified as boolean | null}
            />
          </div>
        )}

        {/* Notifications panel */}
        {notifications && notifications.length > 0 && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 mb-6">
            <h2 className="text-[#F8FAFC] font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6366F1] inline-block" />
              New Notifications
            </h2>
            <div className="space-y-2">
              {notifications.map((n: { id: string; message?: string; body?: string; link?: string }) => (
                <div key={n.id} className="flex items-start gap-3 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  {n.link ? (
                    <Link href={n.link} className="text-[#CBD5E1] hover:text-white transition-colors">
                      {n.message || n.body}
                    </Link>
                  ) : (
                    <p className="text-[#CBD5E1]">{n.message || n.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* My Proposals */}
          {hasProposals && (
            <div>
              <h2 className="text-[#F8FAFC] font-bold text-xl mb-4">My Proposals</h2>
              <div className="space-y-3">
                {myProposals!.map(p => {
                  const project = p.projects as { id?: string; title?: string } | null
                  return (
                    <Link key={p.id} href={`/projects/${project?.id ?? "#"}`}>
                      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-[#6366F1]/40 transition-all flex items-center justify-between">
                        <div>
                          <p className="text-[#F8FAFC] font-medium">{project?.title ?? "Project"}</p>
                          <p className="text-[#94A3B8] text-sm mt-0.5">Bid: ₹{p.bid_amount?.toLocaleString()}</p>
                        </div>
                        <Badge className={`border ${PROPOSAL_STATUS[p.status] ?? PROPOSAL_STATUS.pending} capitalize`}>
                          {p.status}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* My Gigs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#F8FAFC] font-bold text-xl flex items-center gap-2">
                <Package className="h-5 w-5 text-[#6366F1]" /> My Gigs
              </h2>
              <Link href="/gigs/new">
                <Button size="sm" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Gig
                </Button>
              </Link>
            </div>
            {!hasGigs ? (
              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
                <p className="text-[#94A3B8] text-sm mb-3">No gigs yet. Create one to showcase your services.</p>
                <Link href="/gigs/new">
                  <Button size="sm" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold">
                    Create Your First Gig →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGigs!.map(gig => (
                  <Link key={gig.id} href={`/gigs/${gig.id}`}>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-[#6366F1]/40 transition-all">
                      <p className="text-[#94A3B8] text-xs capitalize mb-1">{gig.category}</p>
                      <p className="text-[#F8FAFC] font-semibold text-sm line-clamp-2 mb-2">{gig.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6366F1] font-bold text-sm">₹{gig.price?.toLocaleString()}</span>
                        <span className="text-[#475569] text-xs">{gig.delivery_days}d delivery</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Posted Jobs */}
          {hasJobs && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#F8FAFC] font-bold text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#8B5CF6]" /> My Job Posts
                </h2>
                <Link href="/jobs/new">
                  <Button size="sm" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Post Job
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {myJobs!.map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-[#8B5CF6]/40 transition-all flex items-center justify-between">
                      <div>
                        <p className="text-[#F8FAFC] font-medium">{job.title}</p>
                        <p className="text-[#94A3B8] text-sm capitalize mt-0.5">{job.job_type?.replace("-", " ")}</p>
                      </div>
                      <Badge className={`border ${job.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-[#334155] text-[#94A3B8] border-[#334155]"} capitalize`}>
                        {job.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Open Projects */}
          {openProjects && openProjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#F8FAFC] font-bold text-xl">Open Projects</h2>
                <Link href="/projects" className="text-[#A5B4FC] text-sm hover:underline">View all</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {openProjects.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-[#6366F1]/40 transition-all h-full">
                      <h3 className="text-[#F8FAFC] font-medium line-clamp-2 mb-2">{p.title}</h3>
                      <p className="text-[#94A3B8] text-sm line-clamp-2 mb-3">{p.description}</p>
                      <p className="text-[#06B6D4] font-bold">₹{p.budget?.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#334155]">
            <Link href="/gigs/new">
              <Button className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F8FAFC] font-medium gap-2">
                <Package className="h-4 w-4 text-[#6366F1]" /> Create Gig
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F8FAFC] font-medium gap-2">
                <Briefcase className="h-4 w-4 text-[#8B5CF6]" /> Post Job
              </Button>
            </Link>
            <Link href="/projects">
              <Button className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F8FAFC] font-medium gap-2">
                <Star className="h-4 w-4 text-[#06B6D4]" /> Browse Projects
              </Button>
            </Link>
          </div>

          {/* Support button */}
          <div className="pt-2">
            <DashboardSupportButton />
          </div>
        </div>
      </div>
    </div>
  )
}
