import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Users, Clock } from "lucide-react"
import ProposalForm from "@/components/projects/ProposalForm"
import ReviewForm from "@/components/reviews/ReviewForm"
import type { Metadata } from "next"

const CATEGORY_LABELS: Record<string, string> = {
  "web-dev": "Web Dev",
  "design": "Design",
  "mobile": "Mobile",
  "writing": "Writing",
  "marketing": "Marketing",
  "video": "Video",
  "data": "Data",
  "other": "Other",
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: project } = await supabase
    .from("projects")
    .select("title, description, budget, category")
    .eq("id", id)
    .single()

  if (!project) return { title: "Project Not Found | GigWAY" }

  return {
    title: `${project.title} | GigWAY`,
    description: `${project.description?.slice(0, 150) ?? ""}... Budget: ₹${project.budget?.toLocaleString()}`,
    openGraph: {
      title: `${project.title} | GigWAY`,
      description: project.description?.slice(0, 200),
    },
  }
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      client:client_id(id, full_name, avatar_url, company, is_verified)
    `)
    .eq("id", id)
    .single()

  if (!project) return notFound()

  const { count: proposalCount } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id)

  let hasApplied = false
  let acceptedProposalFreelancerId: string | null = null

  if (user) {
    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("project_id", id)
      .eq("freelancer_id", user.id)
      .single()
    hasApplied = !!existing

    // Check if user is the accepted freelancer
    const { data: accepted } = await supabase
      .from("proposals")
      .select("freelancer_id")
      .eq("project_id", id)
      .eq("status", "accepted")
      .single()
    acceptedProposalFreelancerId = accepted?.freelancer_id ?? null
  }

  const isOwner = user?.id === project.client_id
  const isOpen = project.status === "open"
  const isCompleted = project.status === "completed"
  const isAcceptedFreelancer = user?.id === acceptedProposalFreelancerId

  // Who can leave a review?
  const canReview = isCompleted && user && (isOwner || isAcceptedFreelancer)
  // Client reviews the freelancer, freelancer reviews the client
  const revieweeId = isOwner ? (acceptedProposalFreelancerId ?? "") : project.client_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl font-bold text-white flex-1">{project.title}</h1>
                <Badge className={`border ${STATUS_STYLES[project.status] || STATUS_STYLES.open} capitalize`}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-[#FFD700]" />
                  <span className="text-[#FFD700] font-semibold">₹{project.budget?.toLocaleString()}</span>
                </span>
                {project.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Deadline: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {proposalCount || 0} proposals
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Skills Required */}
            {project.skills_required && project.skills_required.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30 px-3 py-1"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Proposal / Action Section */}
            <div>
              {!user && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 mb-4">Sign in to submit a proposal</p>
                  <Link href="/login">
                    <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {user && isOwner && (
                <Link href={`/projects/${id}/proposals`}>
                  <Button className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold py-5 text-base">
                    View Proposals ({proposalCount || 0})
                  </Button>
                </Link>
              )}

              {user && !isOwner && hasApplied && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                  <p className="text-green-400 font-semibold">You have already submitted a proposal for this project.</p>
                </div>
              )}

              {user && !isOwner && !hasApplied && isOpen && (
                <ProposalForm projectId={id} userId={user.id} />
              )}

              {user && !isOwner && !hasApplied && !isOpen && !isCompleted && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400">This project is no longer accepting proposals.</p>
                </div>
              )}
            </div>

            {/* Review Form — only for completed projects */}
            {canReview && revieweeId && (
              <ReviewForm revieweeId={revieweeId} projectId={id} />
            )}
          </div>

          {/* Sidebar: Client Info */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">About the Client</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-lg">
                  {(project.client as { full_name?: string } | null)?.full_name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {(project.client as { full_name?: string } | null)?.full_name || "Client"}
                  </p>
                  {(project.client as { company?: string } | null)?.company && (
                    <p className="text-gray-400 text-sm">
                      {(project.client as { company?: string }).company}
                    </p>
                  )}
                </div>
              </div>
              <Badge className="bg-white/5 text-gray-400 border-white/10 capitalize">
                {CATEGORY_LABELS[project.category] || project.category}
              </Badge>
            </div>

            {project.project_type && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Project Type</p>
                <p className="text-white font-medium capitalize">{project.project_type === "fixed" ? "Fixed Price" : "Hourly Rate"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
