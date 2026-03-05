import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Briefcase, Users, PlusCircle } from "lucide-react"

export default async function ClientDashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  // Fetch client's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, status, created_at")
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch proposals count for client's projects
  const { data: proposals } = await supabase
    .from("proposals")
    .select("project_id, status")
    .in("project_id", projects?.map(p => p.id) || [])

  const totalProposals = proposals?.length || 0
  const pendingProposals = proposals?.filter(p => p.status === "pending").length || 0

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Projects</p>
                <p className="text-3xl font-bold text-white">{projects?.length || 0}</p>
              </div>
              <Briefcase className="w-8 h-8 text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Proposals</p>
                <p className="text-3xl font-bold text-white">{totalProposals}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{pendingProposals}</p>
              </div>
              <PlusCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post New Project Button */}
      <div className="flex justify-end">
        <Link href="/projects/new">
          <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black">
            + Post New Project
          </Button>
        </Link>
      </div>

      {/* My Projects */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <p className="text-gray-400 text-center py-8">You haven't posted any projects yet.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div>
                    <h3 className="font-semibold text-white">{project.title}</h3>
                    <p className="text-sm text-gray-400">
                      Posted: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm px-2 py-1 rounded ${
                      project.status === 'open' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                    <Link href={`/projects/${project.id}/proposals`}>
                      <Button variant="outline" size="sm" className="border-[#FFD700] text-[#FFD700]">
                        View Proposals
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}