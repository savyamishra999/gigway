"use client"

import { useEffect } from "react"
import CountdownTimer from "@/components/ui/CountdownTimer"
import PayButton from "@/components/pricing/PayButton"

interface Props {
  open: boolean
  onClose: () => void
  redirectAfterPlan?: string
}

export default function PostGateModal({
  open,
  onClose,
  redirectAfterPlan = "/dashboard",
}: Props) {
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
          <div className="w-16 h-16 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-white font-black text-xl leading-snug">
            To post you need<br />
            <span className="text-[#F59E0B]">Hire Talent Plan</span>
          </h2>
        </div>

        {/* Urgency */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
          <p className="text-red-300 font-bold text-sm text-center">
            ⚠️ Best candidates going to your competitors right now
          </p>
        </div>

        {/* Social proof */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 mb-5">
          <p className="text-[#94A3B8] text-xs text-center leading-relaxed">
            💬 &ldquo;TechCorp posted a job for ₹199 and got 47 qualified applications in 24 hours&rdquo;
          </p>
        </div>

        {/* Price + timer */}
        <div className="text-center mb-5">
          <p className="text-[#F59E0B] font-black text-4xl">
            ₹199
            <span className="text-[#64748B] text-base font-normal">/month</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[#64748B] text-xs">⏰ Offer ends in</span>
            <CountdownTimer className="text-sm font-black" />
          </div>
        </div>

        {/* Benefits quick list */}
        <ul className="space-y-1.5 mb-5">
          {[
            "Post unlimited jobs & projects",
            "Access full CV database",
            "Verified Company badge",
          ].map(b => (
            <li key={b} className="flex items-center gap-2 text-[#94A3B8] text-xs">
              <span className="text-[#4ADE80] font-bold flex-shrink-0">✓</span>
              {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <PayButton
          plan="hire_talent_monthly"
          label="Get Plan Now →"
          description="GigWay Hire Talent — ₹199/month"
          isLoggedIn={true}
          redirectTo={redirectAfterPlan}
          className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-black text-base py-4 shadow-lg shadow-[#F59E0B]/25"
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
