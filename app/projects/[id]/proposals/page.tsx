import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star } from "lucide-react"
import ProposalActions from "@/components/projects/ProposalActions"

interface Proposal {
  id: string
  bid_amount: number
  estimated_days: number
  cover_letter: string
  status: string
  created_at: string
  freelancer_id: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    tagline: string | null
    avg_rating: number | null
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default async function ProjectProposalsPage(props: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, client_id, status")
    .eq("id", projectId)
    .single()

  if (!project) return notFound()

  if (project.client_id !== user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-gray-400 mb-6">You don&apos;t have permission to view this page.</p>
          <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    )
  }

  const { data: proposals } = await supabase
    .from("proposals")
    .select(`
      *,
      profiles:freelancer_id(full_name, avatar_url, tagline, avg_rating)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const typedProposals = (proposals as Proposal[]) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Proposals</h1>
            <p className="text-gray-400 text-sm">{project.title}</p>
          </div>
        </div>

        {typedProposals.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-400">No proposals yet. Share your project to get proposals!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {typedProposals.map(proposal => (
              <div key={proposal.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Link href={`/freelancers/${proposal.freelancer_id}`}>
                      <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-lg flex-shrink-0 hover:opacity-80 transition-opacity">
                        {proposal.profiles?.full_name?.[0] || "F"}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/freelancers/${proposal.freelancer_id}`} className="hover:underline">
                        <h3 className="text-white font-semibold">{proposal.profiles?.full_name || "Freelancer"}</h3>
                      </Link>
                      {proposal.profiles?.tagline && (
                        <p className="text-gray-400 text-sm">{proposal.profiles.tagline}</p>
                      )}
                      {proposal.profiles?.avg_rating && proposal.profiles.avg_rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i <= Math.round(proposal.profiles!.avg_rating!) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                            />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">
                            {proposal.profiles.avg_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`border ${STATUS_STYLES[proposal.status] || STATUS_STYLES.pending} capitalize`}>
                    {proposal.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Bid Amount</p>
                    <p className="text-[#FFD700] font-bold text-lg">₹{proposal.bid_amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estimated Days</p>
                    <p className="text-white font-bold text-lg">{proposal.estimated_days} days</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Cover Letter</p>
                  <p className="text-gray-300 bg-white/5 rounded-lg p-4 text-sm leading-relaxed">
                    {proposal.cover_letter}
                  </p>
                </div>

                {proposal.status === "pending" && project.status === "open" && (
                  <ProposalActions
                    proposalId={proposal.id}
                    projectId={projectId}
                    freelancerId={proposal.freelancer_id}
                    clientId={user.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
