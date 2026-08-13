import Link from "next/link"
import { Star, Clock, CheckCircle2 } from "lucide-react"

interface GigProfile { full_name: string | null; username?: string | null; avg_rating: number | null; is_verified: boolean }

export interface Gig {
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
  freelancer_id?: string | null
  profiles?: GigProfile | GigProfile[] | null
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  design: "from-pink-500 to-purple-500",
  development: "from-blue-500 to-cyan-500",
  writing: "from-emerald-500 to-teal-500",
  marketing: "from-brand-coral to-amber-500",
  video: "from-red-500 to-pink-500",
  other: "from-brand-indigo to-brand-coral",
}

function creatorOf(gig: Gig): GigProfile | null {
  return Array.isArray(gig.profiles) ? gig.profiles[0] ?? null : gig.profiles ?? null
}

export default function GigCard({ gig }: { gig: Gig }) {
  const gradient = CATEGORY_GRADIENTS[gig.category?.toLowerCase() ?? "other"] || CATEGORY_GRADIENTS.other
  const creator = creatorOf(gig)
  const displayRating = gig.rating > 0 ? gig.rating : creator?.avg_rating ?? 0
  const creatorHref = creator?.username ? `/u/${creator.username}` : gig.freelancer_id ? `/freelancers/${gig.freelancer_id}` : null

  return (
    <div className="group relative bg-white border border-brand-borderLight rounded-card overflow-hidden shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
      {/* Card-wide link to the service — sits behind the creator link below */}
      <Link href={`/gigs/${gig.id}`} className="absolute inset-0 z-0" aria-label={`View service: ${gig.title}`} />

      {/* Thumbnail */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden pointer-events-none`}>
        {gig.image_url ? (
          <img src={gig.image_url} alt={gig.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white/25 text-5xl font-black select-none">{gig.category?.slice(0, 2).toUpperCase() || "GW"}</div>
        )}
        {gig.category && (
          <span className="absolute top-3 left-3 text-caption font-semibold px-2.5 py-1 rounded-pill bg-black/40 text-white backdrop-blur-sm capitalize">
            {gig.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Creator — separately clickable, sits above the stretched card link */}
        <div className="relative z-10 flex items-center gap-2 mb-3">
          {creatorHref ? (
            <Link href={creatorHref} className="flex items-center gap-2 min-w-0 group/creator" onClick={e => e.stopPropagation()}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {creator?.full_name?.[0]?.toUpperCase() || "F"}
              </div>
              <span className="text-brand-slate text-xs truncate group-hover/creator:text-brand-indigo transition-colors">
                {creator?.full_name || "Professional"}{creator?.username && <span className="text-brand-slate/70"> · @{creator.username}</span>}
              </span>
              {creator?.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo flex-shrink-0" />}
            </Link>
          ) : (
            <span className="text-brand-slate text-xs truncate">Professional</span>
          )}
          {displayRating > 0 && (
            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 pointer-events-none">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-brand-midnight text-xs font-semibold">{displayRating.toFixed(1)}</span>
              {(gig.total_reviews ?? 0) > 0 && <span className="text-brand-slate text-xs">({gig.total_reviews})</span>}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-brand-midnight font-semibold text-sm line-clamp-2 mb-3 flex-1 pointer-events-none">
          {gig.title}
        </h3>

        {/* Tags */}
        {gig.tags && gig.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 pointer-events-none">
            {gig.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-brand-indigo/10 text-brand-indigo px-2 py-0.5 rounded-pill border border-brand-indigo/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-brand-borderLight pt-3 flex items-center justify-between pointer-events-none">
          <div>
            <p className="text-[10px] text-brand-slate uppercase tracking-wide">Starting at</p>
            <p className="text-brand-indigo font-black text-lg">₹{gig.price.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1 text-brand-slate text-xs">
            <Clock className="h-3 w-3" />
            <span>{gig.delivery_days}d delivery</span>
          </div>
        </div>

        <span className="relative z-10 mt-3 flex items-center justify-center w-full text-brand-indigo text-caption font-semibold py-2 rounded-lg bg-brand-indigo/5 group-hover:bg-brand-indigo/10 transition-colors pointer-events-none">
          View Service
        </span>
      </div>
    </div>
  )
}
