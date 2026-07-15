"use client"

import CountdownTimer from "@/components/ui/CountdownTimer"
import PayButton from "@/components/pricing/PayButton"

interface Props {
  type: "find_work" | "hire_talent"
  isLoggedIn: boolean
}

const FIND_WORK_BENEFITS = [
  "Apply to unlimited projects",
  "Apply to jobs",
  "Gig stays listed & visible",
  "Profile in search results",
]

const HIRE_TALENT_BENEFITS = [
  "Post unlimited jobs",
  "Post unlimited projects",
  "Access full CV database",
  "Verified Company badge",
  "Featured listings",
]

export default function PlanCard({ type, isLoggedIn }: Props) {
  const isFindWork = type === "find_work"

  return (
    <div
      className={`bg-gradient-to-br from-[#1A1A2E] to-[#12121A] border-2 rounded-2xl p-6 mb-6 ${
        isFindWork ? "border-[#6366F1]/50" : "border-[#F59E0B]/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white font-black text-lg">
            {isFindWork ? "⚡ Find Work Plan" : "🚀 Hire Talent Plan"}
          </p>
          <p className={`font-black text-4xl mt-1 ${isFindWork ? "text-[#6366F1]" : "text-[#F59E0B]"}`}>
            {isFindWork ? "₹49" : "₹199"}
            <span className="text-[#94A3B8] text-sm font-normal">/month</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#64748B] text-xs mb-1">Offer ends in</p>
          <CountdownTimer className="text-lg" />
        </div>
      </div>

      {/* Social proof */}
      <div
        className={`rounded-xl p-3 mb-5 border ${
          isFindWork
            ? "bg-[#6366F1]/10 border-[#6366F1]/20"
            : "bg-[#F59E0B]/10 border-[#F59E0B]/20"
        }`}
      >
        <p className={`text-xs leading-relaxed ${isFindWork ? "text-[#A5B4FC]" : "text-[#FCD34D]"}`}>
          {isFindWork
            ? `💬 "Rahul from Delhi paid ₹49 and got a ₹8,000 project in 3 days"`
            : `💬 "TechCorp posted a job for ₹199 and got 47 applications in 24 hours"`}
        </p>
      </div>

      {/* Benefits */}
      <ul className="space-y-2.5 mb-6">
        {(isFindWork ? FIND_WORK_BENEFITS : HIRE_TALENT_BENEFITS).map(b => (
          <li key={b} className="flex items-center gap-2.5 text-[#CBD5E1] text-sm">
            <span className="text-[#4ADE80] font-bold flex-shrink-0">✓</span>
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <PayButton
        plan={isFindWork ? "find_work_monthly" : "hire_talent_monthly"}
        label={isFindWork ? "Get ₹49 Now →" : "Get ₹199 Now →"}
        description={
          isFindWork
            ? "GigWay Find Work — ₹49/month"
            : "GigWay Hire Talent — ₹199/month"
        }
        isLoggedIn={isLoggedIn}
        redirectTo="/dashboard"
        className={
          isFindWork
            ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-black text-base py-3.5"
            : "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-black text-base py-3.5"
        }
      />
    </div>
  )
}
