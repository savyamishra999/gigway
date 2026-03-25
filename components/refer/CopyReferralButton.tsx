"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export default function CopyReferralButton({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white font-bold text-sm hover:opacity-90 transition-opacity"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied to Clipboard!" : "Copy Referral Link"}
    </button>
  )
}
