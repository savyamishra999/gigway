import Link from "next/link"
import { CheckCircle, Star } from "lucide-react"
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

export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const initial = freelancer.full_name?.[0]?.toUpperCase() || "?"
  const rating = freelancer.avg_rating ?? 0
  const avColor = availabilityColor[freelancer.availability || ""] || "text-gray-400"
  const avLabel = availabilityLabel[freelancer.availability || ""] || freelancer.availability || ""

  return (
    <Link href={`/freelancers/${freelancer.id}`}>
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#FFD700]/40 hover:bg-white/10 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate group-hover:text-[#FFD700] transition-colors">
                {freelancer.full_name || "Unnamed"}
              </h3>
              {freelancer.is_verified && (
                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
              )}
            </div>
            {freelancer.tagline && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{freelancer.tagline}</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bio */}
        {freelancer.bio && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{freelancer.bio}</p>
        )}

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {freelancer.skills.slice(0, 3).map(skill => (
              <Badge
                key={skill}
                className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20 text-xs px-2 py-0.5"
              >
                {skill}
              </Badge>
            ))}
            {freelancer.skills.length > 3 && (
              <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs px-2 py-0.5">
                +{freelancer.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#FFD700] font-bold text-sm">
            {freelancer.hourly_rate ? `₹${freelancer.hourly_rate}/hr` : "Rate negotiable"}
          </span>
          {avLabel && (
            <span className={`text-xs font-medium ${avColor}`}>{avLabel}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
