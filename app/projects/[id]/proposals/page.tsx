import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProjectProposalsPage(props: any) {
  const params = await props.params
  const projectId = params?.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch project to verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("client_id, title")
    .eq("id", projectId)
    .single()

  if (!project) return notFound()
  if (project.client_id !== user.id) {
    // Not authorized
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-12">
        <div className="container mx-auto p-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-gray-400 mb-6">You don't have permission to view this page.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch proposals with freelancer details
  const { data: proposals } = await supabase
    .from("proposals")
    .select(`
      *,
      profiles:freelancer_id (
        full_name,
        avatar_url,
        hourly_rate
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-12">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-white/20">
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">
            Proposals for: {project.title}
          </h1>
        </div>

        {!proposals || proposals.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">No proposals yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-lg">
                        {proposal.profiles?.full_name?.[0] || "F"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{proposal.profiles?.full_name}</h3>
                        <p className="text-sm text-gray-400">Hourly rate: ₹{proposal.profiles?.hourly_rate || "N/A"}/hr</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        proposal.status === "accepted"
                          ? "bg-green-500"
                          : proposal.status === "rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }
                    >
                      {proposal.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Bid Amount</p>
                      <p className="text-lg font-bold text-[#FFD700]">₹{proposal.bid_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Estimated Days</p>
                      <p className="text-lg font-bold text-white">{proposal.estimated_days}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Cover Letter</p>
                    <p className="text-white bg-white/5 p-4 rounded-lg">{proposal.cover_letter}</p>
                  </div>

                  {proposal.status === "pending" && (
                    <div className="flex gap-2 mt-4 justify-end">
                      <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={async () => {
                          "use server"
                          const supabase = await createClient()
                          await supabase
                            .from("proposals")
                            .update({ status: "accepted" })
                            .eq("id", proposal.id)
                          await supabase
                            .from("projects")
                            .update({ status: "in_progress" })
                            .eq("id", projectId)
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          "use server"
                          const supabase = await createClient()
                          await supabase
                            .from("proposals")
                            .update({ status: "rejected" })
                            .eq("id", proposal.id)
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}