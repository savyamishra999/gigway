import Link from "next/link"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FreelancerCardProps {
  freelancer: {
    id: string
    full_name: string | null
    avatar_url?: string | null
    tagline?: string | null
    bio?: string | null
    hourly_rate?: number | null
    skills?: string[] | null
    is_verified?: boolean | null
    is_boosted?: boolean | null
    boost_expires_at?: string | null
    avg_rating?: number | null
    availability?: string | null
  }
}

const availabilityColor: Record<string, string> = {
  "full-time": "text-green-400",
  "part-time": "text-yellow-400",
  "weekends": "text-blue-400",
  "not-available": "text-red-400",
}

const availabilityLabel: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  "weekends": "Weekends",
  "not-available": "Not Available",
}

function isBoostedActive(freelancer: FreelancerCardProps["freelancer"]): boolean {
  if (!freelancer.is_boosted) return false
  if (!freelancer.boost_expires_at) return false
  return new Date(freelancer.boost_expires_at) > new Date()
}

export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const initial = freelancer.full_name?.[0]?.toUpperCase() || "?"
  const rating = freelancer.avg_rating ?? 0
  const avColor = availabilityColor[freelancer.availability || ""] || "text-[#6B7280]"
  const avLabel = availabilityLabel[freelancer.availability || ""] || freelancer.availability || ""
  const boosted = isBoostedActive(freelancer)

  return (
    <Link href={`/freelancers/${freelancer.id}`}>
      <div
        className={`relative bg-[#12121A] rounded-xl p-5 hover:bg-[#12121A] transition-all cursor-pointer group ${
          boosted
            ? "border-2 border-[#F97316]/60 hover:border-[#F97316] shadow-[0_0_16px_rgba(249,115,22,0.15)]"
            : "border border-[#1E1E2E] hover:border-[#4F46E5]/40"
        }`}
      >
        {/* Featured banner */}
        {boosted && (
          <div className="absolute -top-px left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-[#F97316] via-[#FFD700] to-[#F97316]" />
        )}
        {boosted && (
          <div className="flex items-center gap-1 mb-3 bg-[#F97316]/10 border border-[#F97316]/20 rounded-md px-2 py-1 w-fit">
            <span className="text-[#FFD700] text-xs">⭐</span>
            <span className="text-[#F97316] text-[10px] font-bold uppercase tracking-wider">Featured</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {freelancer.avatar_url
              ? <img src={freelancer.avatar_url} alt={freelancer.full_name ?? ""} className="w-full h-full object-cover" />
              : initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate group-hover:text-[#818CF8] transition-colors">
                {freelancer.full_name || "Unnamed"}
              </h3>
              {freelancer.is_verified && (
                <span className="inline-flex items-center bg-[#4F46E5]/20 text-[#818CF8] text-[10px] px-1.5 py-0.5 rounded-full font-semibold border border-[#4F46E5]/30 flex-shrink-0">
                  ✓ Verified
                </span>
              )}
            </div>
            {freelancer.tagline && (
              <p className="text-xs text-[#6B7280] truncate mt-0.5">{freelancer.tagline}</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-[#F97316] text-[#F97316]" : "text-gray-600"}`}
              />
            ))}
            <span className="text-xs text-[#6B7280] ml-1">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bio */}
        {freelancer.bio && (
          <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">{freelancer.bio}</p>
        )}

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {freelancer.skills.slice(0, 3).map(skill => (
              <Badge
                key={skill}
                className="bg-[#4F46E5]/10 text-[#818CF8] border-[#4F46E5]/20 text-xs px-2 py-0.5"
              >
                {skill}
              </Badge>
            ))}
            {freelancer.skills.length > 3 && (
              <Badge className="bg-white/5 text-[#6B7280] border-white/10 text-xs px-2 py-0.5">
                +{freelancer.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#F97316] font-bold text-sm">
            {freelancer.hourly_rate ? `₹${freelancer.hourly_rate.toLocaleString("en-IN")}/hr` : "Rate negotiable"}
          </span>
          {avLabel && (
            <span className={`text-xs font-medium ${avColor}`}>{avLabel}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
