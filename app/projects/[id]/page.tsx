import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Users, Clock, ShieldCheck, Pencil } from "lucide-react"
import ProposalForm from "@/components/projects/ProposalForm"
import ReviewForm from "@/components/reviews/ReviewForm"
import ReleasePaymentButton from "@/components/escrow/ReleasePaymentButton"
import DeleteButton from "@/components/ui/DeleteButton"
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
  completed: "bg-gray-500/20 text-[#6B7280] border-gray-500/30",
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

  // Fetch accepted freelancer name for release button
  let acceptedFreelancerName = "Freelancer"

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
      .select("freelancer_id, profiles:freelancer_id(full_name)")
      .eq("project_id", id)
      .eq("status", "accepted")
      .single()
    acceptedProposalFreelancerId = accepted?.freelancer_id ?? null
    const acceptedProfile = accepted?.profiles as { full_name?: string | null } | null
    if (acceptedProfile?.full_name) acceptedFreelancerName = acceptedProfile.full_name
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
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl font-bold text-white flex-1">{project.title}</h1>
                <Badge className={`border ${STATUS_STYLES[project.status] || STATUS_STYLES.open} capitalize`}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-[#6B7280] mb-5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-[#F97316]" />
                  <span className="text-[#F97316] font-semibold">₹{project.budget?.toLocaleString()}</span>
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

              <p className="text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Skills Required */}
            {project.skills_required && project.skills_required.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="bg-[#4F46E5]/10 text-[#818CF8] border-[#4F46E5]/20 px-3 py-1"
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
                <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 text-center">
                  <p className="text-[#6B7280] mb-4">Sign in to submit a proposal</p>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold shadow-lg shadow-[#4F46E5]/20 hover:opacity-90">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {user && isOwner && (
                <div className="space-y-3">
                  <Link href={`/projects/${id}/proposals`}>
                    <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 py-5 text-base">
                      View Proposals ({proposalCount || 0})
                    </Button>
                  </Link>
                  <div className="flex gap-3">
                    <Link href={`/projects/${id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E1E2E] text-[#818CF8] hover:bg-[#4F46E5]/10 text-sm font-semibold transition-all">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                    <DeleteButton table="projects" id={id} redirectTo="/projects" label="Delete" />
                  </div>
                </div>
              )}

              {user && !isOwner && hasApplied && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                  <p className="text-green-400 font-semibold">You have already submitted a proposal for this project.</p>
                </div>
              )}

              {user && !isOwner && !hasApplied && isOpen && (
                <ProposalForm
                  projectId={id}
                  userId={user.id}
                  projectTitle={project.title}
                  projectDescription={project.description}
                />
              )}

              {user && !isOwner && !hasApplied && !isOpen && !isCompleted && (
                <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 text-center">
                  <p className="text-[#6B7280]">This project is no longer accepting proposals.</p>
                </div>
              )}
            </div>

            {/* Review Form — only for completed projects */}
            {canReview && revieweeId && (
              <ReviewForm revieweeId={revieweeId} projectId={id} />
            )}
          </div>

          {/* Sidebar: Escrow + Client Info */}
          <div className="space-y-4">

            {/* Escrow status for in_progress projects */}
            {project.status === "in_progress" && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-5 w-5 text-[#818CF8]" />
                  <h2 className="text-white font-semibold">Escrow</h2>
                </div>
                {project.escrow_status === "held" ? (
                  <>
                    <div className="bg-[#4F46E5]/10 rounded-xl p-3 mb-4">
                      <p className="text-[#818CF8] font-bold text-lg">₹{project.escrow_amount?.toLocaleString()}</p>
                      <p className="text-[#6B7280] text-xs">Held in escrow</p>
                    </div>
                    {isOwner ? (
                      <ReleasePaymentButton
                        projectId={id}
                        amount={project.escrow_amount || 0}
                        freelancerName={acceptedFreelancerName}
                      />
                    ) : isAcceptedFreelancer ? (
                      <div className="flex items-center gap-2 text-[#10B981] text-sm">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Payment held in escrow ✓</span>
                      </div>
                    ) : null}
                  </>
                ) : project.escrow_status === "released" ? (
                  <div className="text-[#10B981] text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Payment released</span>
                  </div>
                ) : (
                  <p className="text-[#6B7280] text-sm">
                    {isOwner
                      ? <Link href={`/projects/${id}/proposals`} className="text-[#818CF8] hover:underline">Accept a proposal to set up escrow →</Link>
                      : "Awaiting escrow setup by client"}
                  </p>
                )}
              </div>
            )}

            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">About the Client</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-bold text-lg">
                  {(project.client as { full_name?: string } | null)?.full_name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {(project.client as { full_name?: string } | null)?.full_name || "Client"}
                  </p>
                  {(project.client as { company?: string } | null)?.company && (
                    <p className="text-[#6B7280] text-sm">
                      {(project.client as { company?: string }).company}
                    </p>
                  )}
                </div>
              </div>
              <Badge className="bg-[#4F46E5]/10 text-[#818CF8] border-[#4F46E5]/20 capitalize">
                {CATEGORY_LABELS[project.category] || project.category}
              </Badge>
            </div>

            {project.project_type && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
                <p className="text-[#6B7280] text-sm mb-1">Project Type</p>
                <p className="text-white font-medium capitalize">{project.project_type === "fixed" ? "Fixed Price" : "Hourly Rate"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
