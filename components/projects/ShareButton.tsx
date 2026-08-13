"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, url }); return } catch { /* user cancelled or unsupported — fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable — no-op */ }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-borderLight bg-white text-brand-slate hover:border-brand-indigo/30 hover:text-brand-midnight text-sm font-semibold transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Share"}
    </button>
  )
}
