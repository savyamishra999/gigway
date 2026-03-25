import { Star, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProfileHeaderProps {
  fullName: string | null
  tagline: string | null
  avgRating: number | null
  isVerified: boolean
  hourlyRate: number | null
  availability: string | null
}

const AVAILABILITY_STYLES: Record<string, { label: string; color: string }> = {
  "full-time": { label: "Full Time", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "part-time": { label: "Part Time", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "weekends": { label: "Weekends Only", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "not-available": { label: "Not Available", color: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export default function ProfileHeader({
  fullName,
  tagline,
  avgRating,
  isVerified,
  hourlyRate,
  availability,
}: ProfileHeaderProps) {
  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const rating = avgRating ?? 0
  const avInfo = availability ? AVAILABILITY_STYLES[availability] : null

  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-3xl mb-4 ring-4 ring-[#FFD700]/20">
        {initials}
      </div>

      {/* Name + Verified */}
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-white">{fullName || "Freelancer"}</h1>
        {isVerified && (
          <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
        )}
      </div>

      {/* Tagline */}
      {tagline && (
        <p className="text-gray-400 text-sm mb-3 max-w-xs">{tagline}</p>
      )}

      {/* Rating Stars */}
      {rating > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
            />
          ))}
          <span className="text-gray-400 text-sm ml-1">{rating.toFixed(1)}</span>
        </div>
      )}

      {/* Hourly Rate */}
      {hourlyRate && (
        <p className="text-[#FFD700] font-bold text-lg mb-3">₹{hourlyRate}/hr</p>
      )}

      {/* Availability Badge */}
      {avInfo && (
        <Badge className={`border ${avInfo.color}`}>{avInfo.label}</Badge>
      )}
    </div>
  )
}
