import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, CheckCircle, Edit, ExternalLink } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false })

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name, avatar_url)")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false })

  const avgRating = profile?.avg_rating ?? 0
  const isFreelancer = !!(profile?.skills && profile.skills.length > 0)
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const availabilityLabel: Record<string, { label: string; color: string }> = {
    "full-time": { label: "Full Time", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    "part-time": { label: "Part Time", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    "weekends": { label: "Weekends", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    "not-available": { label: "Not Available", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  }

  const avInfo = availabilityLabel[profile?.availability || ""] || null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-4xl flex-shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">{profile?.full_name || "Your Name"}</h1>
                {profile?.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                )}
              </div>

              {profile?.tagline && (
                <p className="text-gray-400 text-lg mb-2">{profile.tagline}</p>
              )}

              {/* Stars */}
              {avgRating > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= Math.round(avgRating) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                    />
                  ))}
                  <span className="text-gray-400 text-sm ml-1">{avgRating.toFixed(1)}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {profile.location}
                  </span>
                )}
                {isFreelancer && profile?.hourly_rate && (
                  <span className="text-[#FFD700] font-semibold">₹{profile.hourly_rate}/hr</span>
                )}
                {avInfo && (
                  <Badge className={`border ${avInfo.color}`}>{avInfo.label}</Badge>
                )}
              </div>
            </div>

            <Link href="/profile/edit">
              <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
                <Edit className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-3">About</h2>
            <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {isFreelancer && profile?.skills && profile.skills.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
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
        {isFreelancer && profile?.portfolio_links && profile.portfolio_links.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4">Portfolio Links</h2>
            <div className="space-y-2">
              {profile.portfolio_links.map((link: string) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#FFD700] hover:underline text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Items */}
        {portfolio && portfolio.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
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
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] text-sm font-bold">
                      {(review.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {(review.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i <= review.rating ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-400 text-sm pl-11">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member since */}
        <p className="text-center text-gray-600 text-sm mt-8">Member since {joinDate}</p>
      </div>
    </div>
  )
}
