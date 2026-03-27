import Link from "next/link"
import { Star, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Gig {
  id: string
  title: string
  price: number
  delivery_days: number
  category: string | null
  tags: string[] | null
  rating: number
  total_reviews?: number
  orders_count: number
  image_url: string | null
  profiles?: { full_name: string | null; avg_rating: number | null; is_verified: boolean } | null
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  design: "from-pink-600 to-purple-600",
  development: "from-blue-600 to-cyan-600",
  writing: "from-green-600 to-teal-600",
  marketing: "from-orange-600 to-red-600",
  video: "from-red-600 to-pink-600",
  other: "from-[#4F46E5] to-[#F97316]",
}

export default function GigCard({ gig }: { gig: Gig }) {
  const gradient = CATEGORY_GRADIENTS[gig.category?.toLowerCase() ?? "other"] || CATEGORY_GRADIENTS.other
  const initials = gig.profiles?.full_name?.[0]?.toUpperCase() || "G"
  const displayRating = gig.rating > 0 ? gig.rating : gig.profiles?.avg_rating ?? 0

  return (
    <Link href={`/gigs/${gig.id}`}>
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden hover:border-[#4F46E5]/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#4F46E5]/10 transition-all duration-300 group h-full flex flex-col">
        {/* Thumbnail */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {gig.image_url ? (
            <img src={gig.image_url} alt={gig.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-white/20 text-5xl font-black select-none">{gig.category?.slice(0, 2).toUpperCase() || "GW"}</div>
          )}
          {/* Category badge */}
          {gig.category && (
            <Badge className="absolute top-3 left-3 bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">
              {gig.category}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Freelancer */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <span className="text-[#9CA3AF] text-xs truncate">{gig.profiles?.full_name || "Freelancer"}</span>
            {displayRating > 0 && (
              <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                <Star className="h-3 w-3 fill-[#F97316] text-[#F97316]" />
                <span className="text-[#F97316] text-xs font-semibold">{displayRating.toFixed(1)}</span>
                {(gig.total_reviews ?? 0) > 0 && (
                  <span className="text-[#6B7280] text-xs">({gig.total_reviews})</span>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-3 group-hover:text-[#818CF8] transition-colors flex-1">
            {gig.title}
          </h3>

          {/* Tags */}
          {gig.tags && gig.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {gig.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-[#4F46E5]/10 text-[#818CF8] px-2 py-0.5 rounded-full border border-[#4F46E5]/20">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-[#1E1E2E] pt-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Starting at</p>
              <p className="text-[#4F46E5] font-black text-lg">₹{gig.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 text-[#6B7280] text-xs">
              <Clock className="h-3 w-3" />
              <span>{gig.delivery_days}d delivery</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
