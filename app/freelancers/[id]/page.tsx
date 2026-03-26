import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, CheckCircle, ExternalLink, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: f } = await supabase
    .from("profiles")
    .select("full_name, tagline, skills, hourly_rate")
    .eq("id", id)
    .single()

  if (!f) return { title: "Freelancer Not Found | GigWay" }

  const skills = Array.isArray(f.skills) ? f.skills.slice(0, 3).join(", ") : ""
  return {
    title: `${f.full_name} — Freelancer | GigWay`,
    description: f.tagline
      ? `${f.tagline}. Skills: ${skills}. ₹${f.hourly_rate}/hr on GigWay.`
      : `Hire ${f.full_name} on GigWay. Skills: ${skills}.`,
  }
}

const availabilityLabel: Record<string, { label: string; color: string }> = {
  "full-time": { label: "Full Time", color: "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30" },
  "part-time": { label: "Part Time", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "weekends": { label: "Weekends", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "not-available": { label: "Not Available", color: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export default async function FreelancerDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: freelancer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (!freelancer) return notFound()

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name, avatar_url)")
    .eq("reviewee_id", id)
    .order("created_at", { ascending: false })

  const { data: gigs } = await supabase
    .from("gigs")
    .select("id, title, price, category, delivery_days, rating")
    .eq("freelancer_id", id)
    .eq("status", "active")
    .limit(4)

  const avgRating = freelancer.avg_rating ?? 0
  const reviewCount = reviews?.length ?? 0
  const avInfo = availabilityLabel[freelancer.availability || ""] || null

  // Rating breakdown
  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews?.filter(r => Math.round(r.rating) === star).length ?? 0,
    pct: reviewCount > 0
      ? Math.round(((reviews?.filter(r => Math.round(r.rating) === star).length ?? 0) / reviewCount) * 100)
      : 0,
  }))

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-black text-3xl mb-4 mx-auto">
                {freelancer.avatar_url
                  ? <img src={freelancer.avatar_url} alt={freelancer.full_name ?? ""} className="w-full h-full object-cover" />
                  : freelancer.full_name?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-white">{freelancer.full_name || "Freelancer"}</h1>
                  {(freelancer.is_verified || freelancer.verification_status === "verified") && (
                    <CheckCircle className="h-5 w-5 text-[#4F46E5]" />
                  )}
                </div>

                {freelancer.tagline && (
                  <p className="text-[#6B7280] text-sm mb-3">{freelancer.tagline}</p>
                )}

                {avgRating > 0 && (
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`h-4 w-4 ${i <= Math.round(avgRating) ? "fill-[#F97316] text-[#F97316]" : "text-[#374151]"}`} />
                    ))}
                  </div>
                )}
                {avgRating > 0 && (
                  <p className="text-[#9CA3AF] text-sm mb-3">
                    <span className="text-[#F97316] font-bold">{avgRating.toFixed(1)}</span>
                    {" "}({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                  </p>
                )}

                {avInfo && <Badge className={`border ${avInfo.color} mb-3`}>{avInfo.label}</Badge>}
              </div>

              <div className="space-y-2.5 mt-4 text-sm border-t border-[#1E1E2E] pt-4">
                {freelancer.hourly_rate && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Hourly Rate</span>
                    <span className="text-[#F97316] font-bold">₹{freelancer.hourly_rate}/hr</span>
                  </div>
                )}
                {freelancer.location && (
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <MapPin className="h-4 w-4" />
                    <span>{freelancer.location}</span>
                  </div>
                )}
                {freelancer.created_at && (
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(freelancer.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  </div>
                )}
              </div>

              {user && user.id !== id && (
                <Link href={`/messages/${id}`}
                  className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity"
                >
                  <MessageSquare className="h-4 w-4" /> Message
                </Link>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bio */}
            {freelancer.bio && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">About</h2>
                <p className="text-[#9CA3AF] leading-relaxed">{freelancer.bio}</p>
              </div>
            )}

            {/* Skills */}
            {freelancer.skills && freelancer.skills.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill: string) => (
                    <Badge key={skill} className="bg-[#4F46E5]/10 text-[#818CF8] border-[#4F46E5]/20 px-3 py-1 text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Gigs */}
            {gigs && gigs.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Gigs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gigs.map(gig => (
                    <Link key={gig.id} href={`/gigs/${gig.id}`}
                      className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#4F46E5]/40 transition-colors"
                    >
                      <p className="text-[#6B7280] text-xs capitalize mb-1">{gig.category}</p>
                      <p className="text-white font-semibold text-sm line-clamp-2 mb-2">{gig.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#F97316] font-bold text-sm">₹{gig.price.toLocaleString()}</span>
                        <span className="text-[#4B5563] text-xs">{gig.delivery_days}d delivery</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {freelancer.portfolio_links && freelancer.portfolio_links.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Portfolio Links</h2>
                <div className="space-y-2">
                  {freelancer.portfolio_links.map((link: string) => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#818CF8] hover:underline text-sm">
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews with rating breakdown */}
            {reviews && reviews.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-5">
                  Reviews — <span className="text-[#F97316]">{avgRating.toFixed(1)} ★</span>
                  <span className="text-[#6B7280] font-normal text-sm ml-2">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
                </h2>

                {/* Rating breakdown bars */}
                <div className="space-y-2 mb-6">
                  {breakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-0.5 w-16 flex-shrink-0">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= star ? "fill-[#F97316] text-[#F97316]" : "text-[#1E1E2E]"}`} />
                        ))}
                      </div>
                      <div className="flex-1 bg-[#1E1E2E] rounded-full h-2">
                        <div className="bg-[#F97316] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[#4B5563] w-8 text-right flex-shrink-0">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {reviews.map((review: {
                    id: string; rating: number; comment?: string; created_at: string
                    reviewer: { full_name?: string; avatar_url?: string | null } | null
                  }) => (
                    <div key={review.id} className="border-b border-[#1E1E2E] pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] text-sm font-bold flex-shrink-0">
                          {(review.reviewer as { full_name?: string; avatar_url?: string | null } | null)?.avatar_url
                            ? <img src={(review.reviewer as { avatar_url: string }).avatar_url} className="w-full h-full object-cover" alt="" />
                            : (review.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-white text-sm font-medium">
                              {(review.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}
                            </p>
                            <span className="text-xs text-[#4B5563]">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-[#F97316] text-[#F97316]" : "text-[#374151]"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-[#9CA3AF] text-sm pl-12">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
