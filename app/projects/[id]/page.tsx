import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, IndianRupee, Users, Clock, ShieldCheck, Pencil, CheckCircle2, Building2 } from "lucide-react"
import ProposalForm from "@/components/projects/ProposalForm"
import SaveButton from "@/components/projects/SaveButton"
import ShareButton from "@/components/projects/ShareButton"
import MarketplaceShareButton from "@/components/social/MarketplaceShareButton"
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
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-brand-slate border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
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

  if (!project) return { title: "Project Not Found | GigWay" }

  return {
    title: `${project.title} | GigWay`,
    description: `${project.description?.slice(0, 150) ?? ""}... Budget: ₹${project.budget?.toLocaleString()}`,
    openGraph: {
      title: `${project.title} | GigWay`,
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
  const client = project.client as { id?: string; full_name?: string | null; company?: string | null; is_verified?: boolean | null } | null

  return (
    <div className="min-h-screen bg-brand-ivory py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title Card */}
            <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h1 className="text-h2 font-extrabold text-brand-midnight flex-1">{project.title}</h1>
                <span className={`capitalize text-caption font-semibold px-3 py-1.5 rounded-pill border ${STATUS_STYLES[project.status] || STATUS_STYLES.open}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-slate mb-5">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <IndianRupee className="h-4 w-4" />
                  {project.budget?.toLocaleString()}
                </span>
                {project.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Deadline: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {proposalCount || 0} proposal{proposalCount === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-brand-slate leading-relaxed whitespace-pre-wrap text-sm">{project.description}</p>

              {/* Save / Share */}
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-brand-borderLight">
                {user && <SaveButton projectId={id} userId={user.id} />}
                <ShareButton title={project.title} url={`https://gigway.in/projects/${id}`} />
                {user && <MarketplaceShareButton objectType="project" objectId={id} isOwner={isOwner} />}
              </div>
            </div>

            {/* Skills Required */}
            {project.skills_required && project.skills_required.length > 0 && (
              <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                <h2 className="text-brand-midnight font-bold text-h3 mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Proposal / Action Section */}
            <div>
              {!user && (
                <div className="bg-white border border-brand-borderLight rounded-card p-6 text-center shadow-soft">
                  <p className="text-brand-slate mb-4">Sign in to submit a proposal</p>
                  <Link href="/login">
                    <Button className="bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {user && isOwner && (
                <div className="space-y-3">
                  <Link href={`/projects/${id}/proposals`}>
                    <Button className="w-full bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] py-5 text-base">
                      View Proposals ({proposalCount || 0})
                    </Button>
                  </Link>
                  <div className="flex gap-3">
                    <Link href={`/projects/${id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-borderLight text-brand-indigo hover:bg-brand-indigo/5 text-sm font-semibold transition-colors">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                    <DeleteButton table="projects" id={id} redirectTo="/projects" label="Delete" />
                  </div>
                </div>
              )}

              {user && !isOwner && hasApplied && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-card p-6 text-center">
                  <p className="text-emerald-700 font-semibold">You have already submitted a proposal for this project.</p>
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
                <div className="bg-white border border-brand-borderLight rounded-card p-6 text-center shadow-soft">
                  <p className="text-brand-slate">This project is no longer accepting proposals.</p>
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
              <div className="bg-white border border-brand-borderLight rounded-card p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-5 w-5 text-brand-indigo" />
                  <h2 className="text-brand-midnight font-bold">Escrow</h2>
                </div>
                {project.escrow_status === "held" ? (
                  <>
                    <div className="bg-brand-indigo/10 rounded-xl p-3 mb-4">
                      <p className="text-brand-indigo font-bold text-lg">₹{project.escrow_amount?.toLocaleString()}</p>
                      <p className="text-brand-slate text-xs">Held in escrow</p>
                    </div>
                    {isOwner ? (
                      <ReleasePaymentButton
                        projectId={id}
                        amount={project.escrow_amount || 0}
                        freelancerName={acceptedFreelancerName}
                      />
                    ) : isAcceptedFreelancer ? (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Payment held in escrow ✓</span>
                      </div>
                    ) : null}
                  </>
                ) : project.escrow_status === "released" ? (
                  <div className="text-emerald-600 text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Payment released</span>
                  </div>
                ) : (
                  <p className="text-brand-slate text-sm">
                    {isOwner
                      ? <Link href={`/projects/${id}/proposals`} className="text-brand-indigo hover:underline">Accept a proposal to set up escrow →</Link>
                      : "Awaiting escrow setup by client"}
                  </p>
                )}
              </div>
            )}

            <div className="bg-white border border-brand-borderLight rounded-card p-5 shadow-soft">
              <h2 className="text-brand-midnight font-bold mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-indigo" /> About the Client
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-brand-indigo/10 flex items-center justify-center text-brand-indigo font-bold text-lg flex-shrink-0">
                  {client?.full_name?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-brand-midnight font-medium truncate">{client?.full_name || "Client"}</p>
                    {client?.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo flex-shrink-0" />}
                  </div>
                  {client?.company && (
                    <p className="text-brand-slate text-sm truncate">{client.company}</p>
                  )}
                </div>
              </div>
              <span className="inline-block text-caption font-semibold px-2.5 py-1 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 capitalize">
                {CATEGORY_LABELS[project.category] || project.category}
              </span>
            </div>

            {project.project_type && (
              <div className="bg-white border border-brand-borderLight rounded-card p-5 shadow-soft">
                <p className="text-brand-slate text-sm mb-1">Project Type</p>
                <p className="text-brand-midnight font-medium capitalize">{project.project_type === "fixed" ? "Fixed Price" : "Hourly Rate"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
