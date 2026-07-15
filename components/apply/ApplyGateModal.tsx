"use client"

import { useEffect } from "react"
import CountdownTimer from "@/components/ui/CountdownTimer"
import PayButton from "@/components/pricing/PayButton"

interface Props {
  open: boolean
  onClose: () => void
  applicantsCount?: number
  redirectAfterPlan?: string
}

export default function ApplyGateModal({
  open,
  onClose,
  applicantsCount = 47,
  redirectAfterPlan = "/dashboard",
}: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1A1A2E] border border-[#334155] rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50">

        {/* Lock icon + heading */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-white font-black text-xl leading-snug">
            To apply you need<br />
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Find Work Plan
            </span>
          </h2>
        </div>

        {/* Urgency — applicants count */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-3">
          <p className="text-orange-300 font-bold text-sm text-center">
            ⚠️ {applicantsCount} people already applied to this opportunity
          </p>
        </div>

        {/* Social proof */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 mb-5">
          <p className="text-[#94A3B8] text-xs text-center leading-relaxed">
            💬 &ldquo;Rahul from Delhi got ₹8,000 project within 3 days of getting the plan&rdquo;
          </p>
        </div>

        {/* Price + timer */}
        <div className="text-center mb-5">
          <p className="text-[#6366F1] font-black text-4xl">
            ₹49
            <span className="text-[#64748B] text-base font-normal">/month</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[#64748B] text-xs">⏰ Offer ends in</span>
            <CountdownTimer className="text-sm font-black" />
          </div>
        </div>

        {/* CTA */}
        <PayButton
          plan="find_work_monthly"
          label="Get Plan Now →"
          description="GigWay Find Work — ₹49/month"
          isLoggedIn={true}
          redirectTo={redirectAfterPlan}
          className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-black text-base py-4 shadow-lg shadow-[#6366F1]/25"
        />

        <button
          onClick={onClose}
          className="w-full text-center text-[#475569] hover:text-[#64748B] text-sm mt-3 py-2 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
