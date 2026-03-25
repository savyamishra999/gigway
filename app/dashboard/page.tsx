import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, AlertCircle, Zap, Briefcase, Star, Package } from "lucide-react"
import GigCard from "@/components/gigs/GigCard"

const PROPOSAL_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-gray-500/20 text-[#6B7280] border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile?.user_type || !profile?.full_name) {
    redirect("/onboarding")
  }

  const isFreelancer = profile.user_type === "freelancer" || profile.user_type === "both"
  const isClient = profile.user_type === "client" || profile.user_type === "both"
  const firstName = profile.full_name?.split(" ")[0] || "there"

  // Fetch notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5)

  const unreadCount = notifications?.length || 0

  // Freelancer data
  let proposals: {
    id: string
    status: string
    bid_amount: number
    created_at: string
    projects: { id: string; title: string; budget: number } | null
  }[] = []
  let openProjects: {
    id: string
    title: string
    description: string
    budget: number
    category: string
    created_at: string
  }[] = []

  if (isFreelancer) {
    const { data: props } = await supabase
      .from("proposals")
      .select("id, status, bid_amount, created_at, projects:project_id(id, title, budget)")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
    proposals = (props as unknown as typeof proposals) || []

    const { data: proj } = await supabase
      .from("projects")
      .select("id, title, description, budget, category, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6)
    openProjects = proj || []
  }

  // Freelancer gigs
  let myGigs: Parameters<typeof GigCard>[0]["gig"][] = []
  if (isFreelancer) {
    const { data: gigs } = await supabase
      .from("gigs")
      .select("*, profiles:freelancer_id(full_name, avg_rating, is_verified)")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
    myGigs = (gigs as typeof myGigs) || []
  }

  // Client data
  let clientProjects: {
    id: string
    title: string
    budget: number
    status: string
    created_at: string
    proposals: { count: number }[]
  }[] = []

  if (isClient) {
    const { data: cProj } = await supabase
      .from("projects")
      .select("id, title, budget, status, created_at, proposals(count)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
    clientProjects = (cProj as typeof clientProjects) || []
  }

  const hasNoBio = !profile.bio

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">
              Hey <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">{firstName}!</span>
            </h1>
            <p className="text-[#6B7280] mt-1">
              {profile.user_type === "freelancer" && "Ready to find great work?"}
              {profile.user_type === "client" && "Ready to build something great?"}
              {profile.user_type === "both" && "Welcome back to your dashboard."}
            </p>
          </div>

          {/* Notifications Bell */}
          <Link href="/notifications" className="relative">
            <Button variant="outline" size="icon" className="border-[#1E1E2E] bg-[#12121A] hover:bg-[#1E1E2E] relative">
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F97316] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Profile Completion Banner */}
        {hasNoBio && (
          <div className="bg-[#4F46E5]/10 border border-[#4F46E5]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#818CF8]" />
              <p className="text-[#818CF8] text-sm font-medium">
                Complete your profile to attract more {profile.user_type === "client" ? "freelancers" : "clients"}
              </p>
            </div>
            <Link href="/profile/edit">
              <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-semibold text-xs hover:opacity-90">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Upgrade to Pro Banner — only for free tier */}
        {!profile.subscription_tier || profile.subscription_tier === "free" ? (
          <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#F97316]/10 border border-[#4F46E5]/20 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-[#F97316]" />
              <div>
                <p className="text-white text-sm font-semibold">Unlock Pro — Unlimited Connects + Featured Profile</p>
                <p className="text-[#6B7280] text-xs mt-0.5">Starting at ₹199/month</p>
              </div>
            </div>
            <Link href="/subscribe">
              <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-semibold text-xs whitespace-nowrap hover:opacity-90">
                Upgrade →
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Low Connects Warning — for freelancers */}
        {isFreelancer && (profile.connects_balance ?? 10) < 3 && (
          <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-[#F97316]" />
              <p className="text-[#F97316] text-sm font-medium">
                Low on connects! You have <strong>{profile.connects_balance ?? 0}</strong> left. Each proposal costs 1 connect.
              </p>
            </div>
            <Link href="/buy-connects">
              <Button size="sm" variant="outline" className="border-[#F97316]/40 text-[#F97316] hover:bg-[#F97316]/10 text-xs whitespace-nowrap">
                Buy Connects
              </Button>
            </Link>
          </div>
        )}

        {/* Unread Notifications Panel */}
        {notifications && notifications.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 mb-6">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD700] inline-block"></span>
              New Notifications
            </h2>
            <div className="space-y-2">
              {notifications.map((n: { id: string; message: string; link?: string; created_at: string }) => (
                <div key={n.id} className="flex items-start gap-3 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-2 flex-shrink-0"></span>
                  {n.link ? (
                    <Link href={n.link} className="text-gray-300 hover:text-white transition-colors">
                      {n.message}
                    </Link>
                  ) : (
                    <p className="text-gray-300">{n.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isFreelancer && (
            <>
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-[#F97316]">{proposals.length}</p>
                <p className="text-[#6B7280] text-sm mt-1">My Proposals</p>
              </div>
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{proposals.filter(p => p.status === "accepted").length}</p>
                <p className="text-[#6B7280] text-sm mt-1">Accepted</p>
              </div>
            </>
          )}
          {isClient && (
            <>
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-[#F97316]">{clientProjects.length}</p>
                <p className="text-[#6B7280] text-sm mt-1">My Projects</p>
              </div>
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {clientProjects.reduce((acc, p) => acc + (p.proposals?.[0]?.count || 0), 0)}
                </p>
                <p className="text-[#6B7280] text-sm mt-1">Total Proposals</p>
              </div>
            </>
          )}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{profile.avg_rating ? profile.avg_rating.toFixed(1) : "—"}</p>
            <p className="text-[#6B7280] text-sm mt-1">Avg Rating</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{profile.connects_balance ?? 10}</p>
            <p className="text-[#6B7280] text-sm mt-1">Connects</p>
          </div>
        </div>

        {/* FREELANCER SECTION */}
        {isFreelancer && (
          <div className="space-y-8">
            {/* My Proposals */}
            <div>
              <h2 className="text-white font-bold text-xl mb-4">My Proposals</h2>
              {proposals.length === 0 ? (
                <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 text-center">
                  <p className="text-[#6B7280]">No proposals yet.</p>
                  <Link href="/projects">
                    <Button className="mt-4 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold hover:opacity-90">
                      Browse Projects
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.map(p => (
                    <Link key={p.id} href={`/projects/${(p.projects as { id: string } | null)?.id}`}>
                      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#4F46E5]/30 transition-all flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{(p.projects as { title: string } | null)?.title || "Project"}</p>
                          <p className="text-[#6B7280] text-sm mt-0.5">Bid: ₹{p.bid_amount?.toLocaleString()}</p>
                        </div>
                        <Badge className={`border ${PROPOSAL_STATUS_STYLES[p.status] || PROPOSAL_STATUS_STYLES.pending} capitalize`}>
                          {p.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Gigs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-xl flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#4F46E5]" /> My Gigs
                </h2>
                <Link href="/gigs/new">
                  <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold hover:opacity-90 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Gig
                  </Button>
                </Link>
              </div>
              {myGigs.length === 0 ? (
                <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-center">
                  <p className="text-[#6B7280] text-sm mb-3">You haven&apos;t created any gigs yet.</p>
                  <Link href="/gigs/new">
                    <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold hover:opacity-90">
                      Create Your First Gig →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myGigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
                </div>
              )}
            </div>

            {/* Jobs Link */}
            <div className="flex items-center justify-between bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-[#F97316]" />
                <div>
                  <p className="text-white text-sm font-medium">Looking for full-time opportunities?</p>
                  <p className="text-[#6B7280] text-xs">Browse job listings posted by companies</p>
                </div>
              </div>
              <Link href="/jobs">
                <Button size="sm" variant="outline" className="border-[#1E1E2E] text-[#6B7280] hover:bg-[#1E1E2E] text-xs">
                  Browse Jobs
                </Button>
              </Link>
            </div>

            {/* Open Projects */}
            {openProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-xl">Open Projects</h2>
                  <Link href="/projects" className="text-[#818CF8] text-sm hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openProjects.map(p => (
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#4F46E5]/40 transition-all h-full">
                        <h3 className="text-white font-medium line-clamp-2 mb-2">{p.title}</h3>
                        <p className="text-[#6B7280] text-sm line-clamp-2 mb-3">{p.description}</p>
                        <p className="text-[#F97316] font-bold">₹{p.budget?.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLIENT SECTION */}
        {isClient && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-xl">My Projects</h2>
              <Link href="/projects/new">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" /> Post Project
                </Button>
              </Link>
            </div>

            {clientProjects.length === 0 ? (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 text-center">
                <p className="text-[#6B7280] mb-4">You haven&apos;t posted any projects yet.</p>
                <Link href="/projects/new">
                  <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold hover:opacity-90">
                    Post Your First Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientProjects.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#4F46E5]/40 transition-all h-full">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-medium line-clamp-2 flex-1">{p.title}</h3>
                        <Badge className={`border ml-2 flex-shrink-0 ${PROJECT_STATUS_STYLES[p.status] || PROJECT_STATUS_STYLES.open} capitalize text-xs`}>
                          {p.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-[#F97316] font-bold mb-2">₹{p.budget?.toLocaleString()}</p>
                      <div className="flex items-center justify-between text-xs text-[#4B5563]">
                        <span>{p.proposals?.[0]?.count || 0} proposals</span>
                        <Link href={`/projects/${p.id}/proposals`} className="text-[#818CF8] hover:underline">
                          View Proposals
                        </Link>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
