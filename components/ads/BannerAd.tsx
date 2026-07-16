import Link from "next/link"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

export interface Ad {
  id: string
  title: string
  subtitle?: string | null
  cta_text: string
  link_url: string
  image_url?: string | null
  accent_color: string
}

interface Props {
  ad: Ad
  className?: string
}

// Derive soft background from accent color (used for gradient overlay)
function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export default function BannerAd({ ad, className = "" }: Props) {
  const rgb = hexToRgb(ad.accent_color || "#4F46E5")

  return (
    <Link
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group ${className}`}
    >
      <div
        className="relative rounded-2xl overflow-hidden border transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-xl"
        style={{
          borderColor: `rgba(${rgb}, 0.25)`,
          background: `linear-gradient(135deg, rgba(${rgb}, 0.12) 0%, rgba(${rgb}, 0.04) 100%)`,
          boxShadow: `0 0 32px rgba(${rgb}, 0.06)`,
        }}
      >
        {/* Sponsored label */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[9px] font-semibold text-[#475569] bg-[#0A0A0F]/60 border border-[#1E1E2E] px-2 py-0.5 rounded-full tracking-wider uppercase">
            Sponsored
          </span>
        </div>

        <div className="flex items-center gap-4 p-5">
          {/* Logo / image */}
          {ad.image_url ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#12121A]">
              <Image
                src={ad.image_url}
                alt={ad.title}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl"
              style={{ background: `rgba(${rgb}, 0.2)`, color: ad.accent_color }}
            >
              {ad.title[0].toUpperCase()}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight line-clamp-1">{ad.title}</p>
            {ad.subtitle && (
              <p className="text-[#6B7280] text-xs mt-0.5 line-clamp-2 leading-relaxed">{ad.subtitle}</p>
            )}
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-opacity group-hover:opacity-90 whitespace-nowrap"
              style={{
                background: `rgba(${rgb}, 0.15)`,
                color: ad.accent_color,
                border: `1px solid rgba(${rgb}, 0.3)`,
              }}
            >
              {ad.cta_text}
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
