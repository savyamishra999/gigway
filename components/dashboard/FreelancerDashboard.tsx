import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Briefcase, Clock, DollarSign } from "lucide-react"

export default async function FreelancerDashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  // Fetch open projects (latest 5)
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch user's proposals with project details
  const { data: proposals } = await supabase
    .from("proposals")
    .select(`
      *,
      projects (
        title,
        budget
      )
    `)
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false })
    .limit(5)

  // Count proposals by status
  const pendingCount = proposals?.filter(p => p.status === "pending").length || 0
  const acceptedCount = proposals?.filter(p => p.status === "accepted").length || 0
  const totalProposals = proposals?.length || 0

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Proposals</p>
                <p className="text-3xl font-bold text-white">{totalProposals}</p>
              </div>
              <Briefcase className="w-8 h-8 text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Accepted</p>
                <p className="text-3xl font-bold text-green-400">{acceptedCount}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Jobs */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Latest Jobs for You</CardTitle>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No jobs available right now.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
                >
                  <h3 className="font-semibold text-white">{project.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#FFD700] font-bold">₹{project.budget}</span>
                    <span className="text-sm text-gray-400 capitalize">{project.category}</span>
                  </div>
                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.skills_required.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-gray-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Proposals */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">My Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          {!proposals || proposals.length === 0 ? (
            <p className="text-gray-400 text-center py-8">You haven't submitted any proposals yet.</p>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{proposal.projects?.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">Bid: ₹{proposal.bid_amount}</p>
                      <p className="text-sm text-gray-400">Estimated: {proposal.estimated_days} days</p>
                    </div>
                    <Badge
                      className={`${
                        proposal.status === "accepted"
                          ? "bg-green-500"
                          : proposal.status === "rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {proposal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">{proposal.cover_letter}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}