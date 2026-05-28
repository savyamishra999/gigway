"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const DISMISS_KEY = "gw_promo_banner_v1"

export default function StickyBanner() {
  const [visible, setVisible] = useState(false)
  const [href, setHref] = useState("/login?redirect=/dashboard")

  useEffect(() => {
    // Never show again after dismiss
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) return

    setVisible(true)

    // Check auth — logged-in users go straight to dashboard
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setHref("/dashboard")
    })
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-[#F59E0B] text-black w-full">
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center justify-between container mx-auto max-w-7xl px-4 h-10 gap-4">
        <p className="text-sm font-semibold flex-1 text-center">
          ⭐ Boost Profile ₹199/mo &nbsp;|&nbsp; ✅ Get Verified ₹299
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={href}
            className="flex items-center gap-1 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black hover:text-[#F59E0B] transition-colors whitespace-nowrap"
          >
            Start Now <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="p-0.5 rounded hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile layout — stacked */}
      <div className="flex sm:hidden flex-col px-4 py-2 gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold leading-snug">
            ⭐ Boost ₹199/mo &nbsp;|&nbsp; ✅ Verified ₹299
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="p-0.5 rounded hover:bg-black/10 transition-colors flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Link
          href={href}
          className="flex items-center justify-center gap-1.5 bg-white text-black text-sm font-bold py-2 rounded-full hover:bg-black hover:text-[#F59E0B] transition-colors w-full"
        >
          Start Now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
