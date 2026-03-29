import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Star, Clock, Package, CheckCircle, ExternalLink, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import GigCard from "@/components/gigs/GigCard"
import DeleteButton from "@/components/ui/DeleteButton"
import type { Metadata } from "next"

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: gig } = await supabase.from("gigs").select("title, description, price").eq("id", id).single()
  if (!gig) return { title: "Gig Not Found | GigWay" }
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
    .select("*, profiles:freelancer_id(id, full_name, avg_rating, bio, tagline, is_verified, skills, avatar_url)")
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
    .select("*, profiles:freelancer_id(full_name, avg_rating, is_verified)")
    .eq("freelancer_id", gig.freelancer_id)
    .eq("status", "active")
    .neq("id", id)
    .limit(3)

  const freelancer = gig.profiles as {
    id: string; full_name: string | null; avg_rating: number | null;
    bio: string | null; tagline: string | null; is_verified: boolean;
    skills: string[] | null; avatar_url: string | null
  } | null

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Thumbnail */}
            <div className="rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center">
              {gig.image_url
                ? <img src={gig.image_url} alt={gig.title} className="w-full h-full object-cover" />
                : <span className="text-white/20 text-6xl font-black">{gig.category?.slice(0, 2).toUpperCase() || "GW"}</span>
              }
            </div>

            {/* Title */}
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  {gig.category && (
                    <Badge className="bg-[#4F46E5]/20 text-[#818CF8] border-[#4F46E5]/30 capitalize">
                      {gig.category}
                    </Badge>
                  )}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Link href={`/gigs/${id}/edit`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#1E1E2E] text-[#818CF8] hover:bg-[#4F46E5]/10 text-sm font-semibold transition-all">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                    <DeleteButton table="gigs" id={id} redirectTo="/gigs" label="Delete" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-black text-white mb-4">{gig.title}</h1>

              {/* Freelancer mini row */}
              {freelancer && (
                <Link href={`/freelancers/${freelancer.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold text-sm">
                    {freelancer.full_name?.[0]?.toUpperCase() || "F"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-medium group-hover:text-[#818CF8] transition-colors">{freelancer.full_name}</span>
                      {freelancer.is_verified && <CheckCircle className="h-4 w-4 text-[#4F46E5]" />}
                    </div>
                    {freelancer.tagline && <p className="text-[#6B7280] text-xs">{freelancer.tagline}</p>}
                  </div>
                  {(freelancer.avg_rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Star className="h-4 w-4 fill-[#F97316] text-[#F97316]" />
                      <span className="text-[#F97316] font-semibold text-sm">{freelancer.avg_rating?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4">About This Gig</h2>
              <p className="text-[#9CA3AF] leading-relaxed whitespace-pre-wrap text-sm">{gig.description}</p>
            </div>

            {/* Tags */}
            {gig.tags && gig.tags.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {gig.tags.map((tag: string) => (
                    <span key={tag} className="text-sm bg-[#4F46E5]/10 text-[#818CF8] px-3 py-1 rounded-full border border-[#4F46E5]/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Freelancer */}
            {freelancer?.bio && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">About the Freelancer</h2>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4">{freelancer.bio}</p>
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.slice(0, 6).map((s: string) => (
                      <Badge key={s} className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Reviews ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map((r: { id: string; rating: number; comment?: string; created_at: string; reviewer: { full_name?: string } | null }) => (
                    <div key={r.id} className="border-b border-[#1E1E2E] pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] text-xs font-bold">
                          {(r.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                        </div>
                        <span className="text-white text-sm font-medium">{(r.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-[#F97316] text-[#F97316]" : "text-[#374151]"}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-[#6B7280] text-sm pl-10">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More gigs */}
            {moreGigs && moreGigs.length > 0 && (
              <div>
                <h2 className="text-white font-bold text-lg mb-4">More Gigs by {freelancer?.full_name?.split(" ")[0]}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {moreGigs.map((g: Parameters<typeof GigCard>[0]["gig"]) => <GigCard key={g.id} gig={g} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Pricing Card */}
          <div className="space-y-4">
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 sticky top-20">
              <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-1">Starting at</p>
              <p className="text-4xl font-black text-white mb-6">₹{gig.price.toLocaleString()}</p>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-3 text-[#9CA3AF]">
                  <Clock className="h-4 w-4 text-[#4F46E5]" />
                  <span>{gig.delivery_days} day delivery</span>
                </div>
                {gig.orders_count > 0 && (
                  <div className="flex items-center gap-3 text-[#9CA3AF]">
                    <Package className="h-4 w-4 text-[#10B981]" />
                    <span>{gig.orders_count} orders completed</span>
                  </div>
                )}
                {(gig.rating > 0 || (freelancer?.avg_rating ?? 0) > 0) && (
                  <div className="flex items-center gap-3 text-[#9CA3AF]">
                    <Star className="h-4 w-4 text-[#F97316]" />
                    <span>{(gig.rating || freelancer?.avg_rating || 0).toFixed(1)} rating</span>
                  </div>
                )}
              </div>

              {user ? (
                <Link href={`/messages/${gig.freelancer_id}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-base shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity"
                >
                  <MessageIcon /> Contact Freelancer
                </Link>
              ) : (
                <Link href="/login"
                  className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-base shadow-lg shadow-[#4F46E5]/20 hover:opacity-90"
                >
                  Sign In to Order
                </Link>
              )}

              {freelancer && (
                <Link href={`/freelancers/${freelancer.id}`}
                  className="flex items-center justify-center gap-1 w-full py-3 mt-3 rounded-xl border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#2A2A3E] text-sm transition-all"
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

function MessageIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}
