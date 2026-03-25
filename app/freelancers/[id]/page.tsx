import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, CheckCircle, ExternalLink, Calendar } from "lucide-react"
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

  if (!f) return { title: "Freelancer Not Found | GigWAY" }

  const skills = Array.isArray(f.skills) ? f.skills.slice(0, 3).join(", ") : ""
  return {
    title: `${f.full_name} — Freelancer | GigWAY`,
    description: f.tagline
      ? `${f.tagline}. Skills: ${skills}. ₹${f.hourly_rate}/hr on GigWAY.`
      : `Hire ${f.full_name} on GigWAY. Skills: ${skills}.`,
    openGraph: {
      title: `${f.full_name} | GigWAY`,
      description: f.tagline ?? `Hire ${f.full_name} on GigWAY`,
    },
  }
}

const availabilityLabel: Record<string, { label: string; color: string }> = {
  "full-time": { label: "Full Time", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "part-time": { label: "Part Time", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "weekends": { label: "Weekends", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "not-available": { label: "Not Available", color: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export default async function FreelancerDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: freelancer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (!freelancer) return notFound()

  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("freelancer_id", id)
    .order("created_at", { ascending: false })

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name, avatar_url)")
    .eq("reviewee_id", id)
    .order("created_at", { ascending: false })

  const { data: userRecord } = await supabase.auth.admin?.getUserById?.(id).catch(() => ({ data: null })) ?? { data: null }
  const joinDate = userRecord?.user?.created_at
    ? new Date(userRecord.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null

  const avgRating = freelancer.avg_rating ?? 0
  const avInfo = availabilityLabel[freelancer.availability || ""] || null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-3xl mb-4 mx-auto">
                {freelancer.full_name?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{freelancer.full_name || "Freelancer"}</h1>
                  {freelancer.is_verified && <CheckCircle className="h-5 w-5 text-blue-400" />}
                </div>

                {freelancer.tagline && (
                  <p className="text-gray-400 text-sm mb-3">{freelancer.tagline}</p>
                )}

                {avgRating > 0 && (
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i <= Math.round(avgRating) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                      />
                    ))}
                    <span className="text-gray-400 text-sm ml-1">{avgRating.toFixed(1)}</span>
                  </div>
                )}

                {avInfo && (
                  <Badge className={`border ${avInfo.color} mb-3`}>{avInfo.label}</Badge>
                )}
              </div>

              <div className="space-y-2 mt-4 text-sm">
                {freelancer.hourly_rate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hourly Rate</span>
                    <span className="text-[#FFD700] font-bold">₹{freelancer.hourly_rate}/hr</span>
                  </div>
                )}
                {freelancer.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{freelancer.location}</span>
                  </div>
                )}
                {joinDate && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {joinDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {freelancer.bio && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">About</h2>
                <p className="text-gray-300 leading-relaxed">{freelancer.bio}</p>
              </div>
            )}

            {/* Skills */}
            {freelancer.skills && freelancer.skills.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30 px-3 py-1 text-sm"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {freelancer.portfolio_links && freelancer.portfolio_links.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Portfolio Links</h2>
                <div className="space-y-2">
                  {freelancer.portfolio_links.map((link: string) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#FFD700] hover:underline text-sm"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Items */}
            {portfolio && portfolio.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Portfolio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.map((item: { id: string; title: string; live_url?: string }) => (
                    <a
                      key={item.id}
                      href={item.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#FFD700]/40 transition-all group"
                    >
                      <h3 className="text-white font-medium group-hover:text-[#FFD700] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-1">{item.live_url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Reviews ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map((review: {
                    id: string
                    rating: number
                    comment?: string
                    created_at: string
                    reviewer: { full_name?: string } | null
                  }) => (
                    <div key={review.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] text-sm font-bold flex-shrink-0">
                          {(review.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-white text-sm font-medium">
                              {(review.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-400 text-sm pl-12">{review.comment}</p>
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
