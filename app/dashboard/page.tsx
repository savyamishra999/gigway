import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, AlertCircle, Zap, Briefcase, Star } from "lucide-react"

const PROPOSAL_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Hey <span className="text-[#FFD700]">{firstName}!</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {profile.user_type === "freelancer" && "Ready to find great work?"}
              {profile.user_type === "client" && "Ready to build something great?"}
              {profile.user_type === "both" && "Welcome back to your dashboard."}
            </p>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10 relative">
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD700] text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Completion Banner */}
        {hasNoBio && (
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#FFD700]" />
              <p className="text-[#FFD700] text-sm font-medium">
                Complete your profile to attract more {profile.user_type === "client" ? "freelancers" : "clients"}
              </p>
            </div>
            <Link href="/profile/edit">
              <Button size="sm" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold text-xs">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Upgrade to Pro Banner — only for free tier */}
        {!profile.subscription_tier || profile.subscription_tier === "free" ? (
          <div className="bg-gradient-to-r from-[#FFD700]/10 to-purple-500/10 border border-[#FFD700]/20 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-[#FFD700]" />
              <div>
                <p className="text-white text-sm font-semibold">Unlock Pro — Unlimited Connects + Featured Profile</p>
                <p className="text-gray-400 text-xs mt-0.5">Starting at ₹199/month</p>
              </div>
            </div>
            <Link href="/subscribe">
              <Button size="sm" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold text-xs whitespace-nowrap">
                Upgrade →
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Low Connects Warning — for freelancers */}
        {isFreelancer && (profile.connects_balance ?? 10) < 3 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-orange-400" />
              <p className="text-orange-300 text-sm font-medium">
                Low on connects! You have <strong>{profile.connects_balance ?? 0}</strong> left. Each proposal costs 1 connect.
              </p>
            </div>
            <Link href="/buy-connects">
              <Button size="sm" variant="outline" className="border-orange-500/40 text-orange-300 hover:bg-orange-500/10 text-xs whitespace-nowrap">
                Buy Connects
              </Button>
            </Link>
          </div>
        )}

        {/* Unread Notifications Panel */}
        {notifications && notifications.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
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
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-[#FFD700]">{proposals.length}</p>
                <p className="text-gray-400 text-sm mt-1">My Proposals</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{proposals.filter(p => p.status === "accepted").length}</p>
                <p className="text-gray-400 text-sm mt-1">Accepted</p>
              </div>
            </>
          )}
          {isClient && (
            <>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-[#FFD700]">{clientProjects.length}</p>
                <p className="text-gray-400 text-sm mt-1">My Projects</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {clientProjects.reduce((acc, p) => acc + (p.proposals?.[0]?.count || 0), 0)}
                </p>
                <p className="text-gray-400 text-sm mt-1">Total Proposals</p>
              </div>
            </>
          )}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{profile.avg_rating ? profile.avg_rating.toFixed(1) : "—"}</p>
            <p className="text-gray-400 text-sm mt-1">Avg Rating</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{profile.connects_balance ?? 10}</p>
            <p className="text-gray-400 text-sm mt-1">Connects</p>
          </div>
        </div>

        {/* FREELANCER SECTION */}
        {isFreelancer && (
          <div className="space-y-8">
            {/* My Proposals */}
            <div>
              <h2 className="text-white font-bold text-xl mb-4">My Proposals</h2>
              {proposals.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <p className="text-gray-400">No proposals yet.</p>
                  <Link href="/projects">
                    <Button className="mt-4 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold">
                      Browse Projects
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.map(p => (
                    <Link key={p.id} href={`/projects/${(p.projects as { id: string } | null)?.id}`}>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{(p.projects as { title: string } | null)?.title || "Project"}</p>
                          <p className="text-gray-400 text-sm mt-0.5">Bid: ₹{p.bid_amount?.toLocaleString()}</p>
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

            {/* Jobs Link */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-[#FFD700]" />
                <div>
                  <p className="text-white text-sm font-medium">Looking for full-time opportunities?</p>
                  <p className="text-gray-400 text-xs">Browse job listings posted by companies</p>
                </div>
              </div>
              <Link href="/jobs">
                <Button size="sm" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 text-xs">
                  Browse Jobs
                </Button>
              </Link>
            </div>

            {/* Open Projects */}
            {openProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-xl">Open Projects</h2>
                  <Link href="/projects" className="text-[#FFD700] text-sm hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openProjects.map(p => (
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#FFD700]/40 transition-all h-full">
                        <h3 className="text-white font-medium line-clamp-2 mb-2">{p.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{p.description}</p>
                        <p className="text-[#FFD700] font-bold">₹{p.budget?.toLocaleString()}</p>
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
                <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold">
                  <Plus className="h-4 w-4 mr-2" /> Post Project
                </Button>
              </Link>
            </div>

            {clientProjects.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">You haven&apos;t posted any projects yet.</p>
                <Link href="/projects/new">
                  <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold">
                    Post Your First Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientProjects.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#FFD700]/40 transition-all h-full">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-medium line-clamp-2 flex-1">{p.title}</h3>
                        <Badge className={`border ml-2 flex-shrink-0 ${PROJECT_STATUS_STYLES[p.status] || PROJECT_STATUS_STYLES.open} capitalize text-xs`}>
                          {p.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-[#FFD700] font-bold mb-2">₹{p.budget?.toLocaleString()}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{p.proposals?.[0]?.count || 0} proposals</span>
                        <Link href={`/projects/${p.id}/proposals`} className="text-[#FFD700] hover:underline">
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
