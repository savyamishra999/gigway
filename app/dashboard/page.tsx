import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, AlertCircle, Zap, Briefcase, Star, Package } from "lucide-react"

const PROPOSAL_STATUS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
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

  if (!profile?.profile_completed) redirect("/onboarding")

  const firstName = profile.full_name?.split(" ")[0] || "there"

  const [
    { data: notifications },
    { data: myGigs },
    { data: myJobs },
    { data: myProposals },
    { data: openProjects },
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
  ])

  const unreadCount = notifications?.length ?? 0
  const hasGigs = (myGigs?.length ?? 0) > 0
  const hasJobs = (myJobs?.length ?? 0) > 0
  const hasProposals = (myProposals?.length ?? 0) > 0

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
            <p className="text-[#94A3B8] mt-1">Here&apos;s what&apos;s happening on GigWAY</p>
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

        {/* Profile completion banner */}
        {!profile.bio && (
          <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#A5B4FC]" />
              <p className="text-[#A5B4FC] text-sm font-medium">Add a bio to complete your profile and attract more connections</p>
            </div>
            <Link href="/profile/edit">
              <Button size="sm" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-xs">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Low connects warning */}
        {(profile.connects_balance ?? 10) < 3 && (
          <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-[#C4B5FD]" />
              <p className="text-[#C4B5FD] text-sm font-medium">
                Low on connects — <strong>{profile.connects_balance ?? 0}</strong> left. Each proposal costs 1 connect.
              </p>
            </div>
            <Link href="/buy-connects">
              <Button size="sm" variant="outline" className="border-[#8B5CF6]/40 text-[#C4B5FD] hover:bg-[#8B5CF6]/10 text-xs">
                Buy Connects
              </Button>
            </Link>
          </div>
        )}

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
            <p className="text-3xl font-bold text-[#06B6D4]">{profile.connects_balance ?? 10}</p>
            <p className="text-[#94A3B8] text-sm mt-1">Connects</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#F8FAFC]">
              {profile.avg_rating ? profile.avg_rating.toFixed(1) : "—"}
            </p>
            <p className="text-[#94A3B8] text-sm mt-1">Avg Rating</p>
          </div>
        </div>

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
        </div>
      </div>
    </div>
  )
}
