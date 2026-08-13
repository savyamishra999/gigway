import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Star, Clock, Package, CheckCircle2, ExternalLink, Pencil, MessageSquare } from "lucide-react"
import GigCard, { type Gig } from "@/components/gigs/GigCard"
import DeleteButton from "@/components/ui/DeleteButton"
import type { Metadata } from "next"

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: gig } = await supabase.from("gigs").select("title, description, price").eq("id", id).single()
  if (!gig) return { title: "Service Not Found | GigWay" }
  return {
    title: `${gig.title} | GigWay`,
    description: `${gig.description?.slice(0, 150) ?? ""}... Starting at ₹${gig.price}`,
  }
}

export default async function GigDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gig } = await supabase
    .from("gigs")
    .select("*, profiles:freelancer_id(id, full_name, username, avg_rating, bio, tagline, is_verified, skills, avatar_url)")
    .eq("id", id)
    .single()

  if (!gig || (gig.status !== "active" && user?.id !== gig.freelancer_id)) return notFound()

  const isOwner = user?.id === gig.freelancer_id

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name)")
    .eq("reviewee_id", gig.freelancer_id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: moreGigs } = await supabase
    .from("gigs")
    .select("id, title, price, delivery_days, category, tags, rating, orders_count, image_url, freelancer_id, profiles:freelancer_id(full_name, username, avg_rating, is_verified)")
    .eq("freelancer_id", gig.freelancer_id)
    .eq("status", "active")
    .neq("id", id)
    .limit(3)

  const freelancer = gig.profiles as {
    id: string; full_name: string | null; username: string | null; avg_rating: number | null;
    bio: string | null; tagline: string | null; is_verified: boolean;
    skills: string[] | null; avatar_url: string | null
  } | null
  const profileHref = freelancer ? (freelancer.username ? `/u/${freelancer.username}` : `/freelancers/${freelancer.id}`) : null

  return (
    <div className="min-h-screen bg-brand-ivory py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Thumbnail */}
            <div className="rounded-card overflow-hidden h-64 bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center shadow-soft">
              {gig.image_url
                ? <img src={gig.image_url} alt={gig.title} className="w-full h-full object-cover" />
                : <span className="text-white/25 text-6xl font-black">{gig.category?.slice(0, 2).toUpperCase() || "GW"}</span>
              }
            </div>

            {/* Title */}
            <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  {gig.category && (
                    <span className="inline-block text-caption font-semibold px-2.5 py-1 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 capitalize">
                      {gig.category}
                    </span>
                  )}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Link href={`/gigs/${id}/edit`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-borderLight text-brand-indigo hover:bg-brand-indigo/5 text-sm font-semibold transition-colors">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                    <DeleteButton table="gigs" id={id} redirectTo="/gigs" label="Delete" />
                  </div>
                )}
              </div>
              <h1 className="text-h2 font-extrabold text-brand-midnight mb-4">{gig.title}</h1>

              {/* Freelancer mini row */}
              {freelancer && profileHref && (
                <Link href={profileHref} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                    {freelancer.avatar_url ? <img src={freelancer.avatar_url} alt="" className="w-full h-full object-cover" /> : (freelancer.full_name?.[0]?.toUpperCase() || "F")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-brand-midnight font-semibold group-hover:text-brand-indigo transition-colors">{freelancer.full_name}</span>
                      {freelancer.username && <span className="text-brand-slate text-sm">@{freelancer.username}</span>}
                      {freelancer.is_verified && <CheckCircle2 className="h-4 w-4 text-brand-indigo flex-shrink-0" />}
                    </div>
                    {freelancer.tagline && <p className="text-brand-slate text-xs truncate">{freelancer.tagline}</p>}
                  </div>
                  {(freelancer.avg_rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-brand-midnight font-semibold text-sm">{freelancer.avg_rating?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
              <h2 className="text-brand-midnight font-bold text-h3 mb-4">About This Service</h2>
              <p className="text-brand-slate leading-relaxed whitespace-pre-wrap text-sm">{gig.description}</p>
            </div>

            {/* Tags */}
            {gig.tags && gig.tags.length > 0 && (
              <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                <h2 className="text-brand-midnight font-bold text-h3 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {gig.tags.map((tag: string) => (
                    <span key={tag} className="text-sm px-3 py-1.5 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Creator panel */}
            {freelancer?.bio && (
              <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                <h2 className="text-brand-midnight font-bold text-h3 mb-4">About the Professional</h2>
                <p className="text-brand-slate text-sm leading-relaxed mb-4">{freelancer.bio}</p>
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.slice(0, 6).map((s: string) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-pill bg-brand-coral/10 text-brand-coral border border-brand-coral/20">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-soft">
                <h2 className="text-brand-midnight font-bold text-h3 mb-4">Reviews ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map((r: { id: string; rating: number; comment?: string; created_at: string; reviewer: { full_name?: string } | null }) => (
                    <div key={r.id} className="border-b border-brand-borderLight pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-indigo/10 flex items-center justify-center text-brand-indigo text-xs font-bold flex-shrink-0">
                          {(r.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                        </div>
                        <span className="text-brand-midnight text-sm font-medium">{(r.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-brand-slate text-sm pl-10">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other services */}
            {moreGigs && moreGigs.length > 0 && (
              <div>
                <h2 className="text-brand-midnight font-bold text-h3 mb-4">Other Services by {freelancer?.full_name?.split(" ")[0]}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(moreGigs as unknown as Gig[]).map(g => <GigCard key={g.id} gig={g} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Pricing Card */}
          <div className="space-y-4">
            <div className="bg-white border border-brand-borderLight rounded-card p-6 shadow-elevated sticky top-20">
              <p className="text-brand-slate text-xs uppercase tracking-wide mb-1">Starting at</p>
              <p className="text-4xl font-black text-brand-midnight mb-6">₹{gig.price.toLocaleString()}</p>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-3 text-brand-slate">
                  <Clock className="h-4 w-4 text-brand-indigo" />
                  <span>{gig.delivery_days} day delivery</span>
                </div>
                {gig.orders_count > 0 && (
                  <div className="flex items-center gap-3 text-brand-slate">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <span>{gig.orders_count} orders completed</span>
                  </div>
                )}
                {(gig.rating > 0 || (freelancer?.avg_rating ?? 0) > 0) && (
                  <div className="flex items-center gap-3 text-brand-slate">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>{(gig.rating || freelancer?.avg_rating || 0).toFixed(1)} rating</span>
                  </div>
                )}
              </div>

              {user ? (
                <Link href={`/messages/${gig.freelancer_id}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-brand-indigo text-white font-bold text-base shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] hover:bg-brand-indigoDark transition-colors"
                >
                  <MessageSquare className="h-5 w-5" /> Contact Professional
                </Link>
              ) : (
                <Link href="/login"
                  className="flex items-center justify-center w-full py-4 rounded-2xl bg-brand-indigo text-white font-bold text-base shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] hover:bg-brand-indigoDark transition-colors"
                >
                  Sign In to Order
                </Link>
              )}

              {profileHref && (
                <Link href={profileHref}
                  className="flex items-center justify-center gap-1 w-full py-3 mt-3 rounded-xl border border-brand-borderLight text-brand-slate hover:text-brand-midnight hover:border-brand-indigo/30 text-sm transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View Full Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
