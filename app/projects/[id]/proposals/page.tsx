import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, ShieldCheck } from "lucide-react"
import ProposalActions from "@/components/projects/ProposalActions"
import EscrowPayButton from "@/components/escrow/EscrowPayButton"

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
  accepted: "bg-[#4F46E5]/20 text-[#818CF8] border-[#4F46E5]/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default async function ProjectProposalsPage(props: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, client_id, status, escrow_status, escrow_amount")
    .eq("id", projectId)
    .single()

  if (!project) return notFound()

  if (project.client_id !== user.id) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-[#6B7280] mb-6">You don&apos;t have permission to view this page.</p>
          <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    )
  }

  const { data: proposals } = await supabase
    .from("proposals")
    .select("*, profiles:freelancer_id(full_name, avatar_url, tagline, avg_rating)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const typedProposals = (proposals as Proposal[]) || []
  const acceptedProposal = typedProposals.find(p => p.status === "accepted")

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-[#1E1E2E] bg-[#12121A] hover:bg-[#1E1E2E]">
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Proposals</h1>
            <p className="text-[#6B7280] text-sm">{project.title}</p>
          </div>
        </div>

        {/* Escrow held banner */}
        {project.escrow_status === "held" && (
          <div className="mb-6 bg-[#4F46E5]/10 border border-[#4F46E5]/30 rounded-2xl p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#818CF8] flex-shrink-0" />
            <div>
              <p className="text-[#818CF8] font-semibold text-sm">Escrow Active</p>
              <p className="text-[#6B7280] text-xs">₹{project.escrow_amount?.toLocaleString()} is securely held. Release payment when work is complete.</p>
            </div>
          </div>
        )}

        {typedProposals.length === 0 ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
            <p className="text-[#6B7280]">No proposals yet. Share your project to get proposals!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {typedProposals.map(proposal => (
              <div key={proposal.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Link href={`/freelancers/${proposal.freelancer_id}`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 hover:opacity-80 transition-opacity">
                        {proposal.profiles?.full_name?.[0] || "F"}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/freelancers/${proposal.freelancer_id}`} className="hover:underline">
                        <h3 className="text-white font-semibold">{proposal.profiles?.full_name || "Freelancer"}</h3>
                      </Link>
                      {proposal.profiles?.tagline && (
                        <p className="text-[#6B7280] text-sm">{proposal.profiles.tagline}</p>
                      )}
                      {proposal.profiles?.avg_rating && proposal.profiles.avg_rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= Math.round(proposal.profiles!.avg_rating!) ? "fill-[#F97316] text-[#F97316]" : "text-[#374151]"}`} />
                          ))}
                          <span className="text-xs text-[#6B7280] ml-1">{proposal.profiles.avg_rating.toFixed(1)}</span>
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
                    <p className="text-xs text-[#4B5563]">Bid Amount</p>
                    <p className="text-[#F97316] font-bold text-lg">₹{proposal.bid_amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4B5563]">Estimated Days</p>
                    <p className="text-white font-bold text-lg">{proposal.estimated_days} days</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[#4B5563] mb-2">Cover Letter</p>
                  <p className="text-[#9CA3AF] bg-[#0A0A0F] rounded-xl p-4 text-sm leading-relaxed">
                    {proposal.cover_letter}
                  </p>
                </div>

                {/* Accept / Reject buttons for pending proposals */}
                {proposal.status === "pending" && project.status === "open" && (
                  <ProposalActions
                    proposalId={proposal.id}
                    projectId={projectId}
                    freelancerId={proposal.freelancer_id}
                    clientId={user.id}
                  />
                )}

                {/* Escrow payment for accepted proposal (if not yet held) */}
                {proposal.status === "accepted" && project.escrow_status !== "held" && project.escrow_status !== "released" && (
                  <div className="mt-5 bg-[#4F46E5]/5 border border-[#4F46E5]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-[#818CF8]" />
                      <p className="text-[#818CF8] font-semibold text-sm">Secure Escrow Payment</p>
                    </div>
                    <p className="text-[#6B7280] text-xs mb-3">
                      Pay ₹{proposal.bid_amount.toLocaleString()} into escrow to begin work. Funds are only released when you&apos;re satisfied.
                    </p>
                    <EscrowPayButton
                      proposalId={proposal.id}
                      projectId={projectId}
                      bidAmount={proposal.bid_amount}
                      freelancerName={proposal.profiles?.full_name || "Freelancer"}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
