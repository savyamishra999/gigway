"use client"

import CountdownTimer from "@/components/ui/CountdownTimer"
import PayButton from "@/components/pricing/PayButton"

interface Props {
  type: "find_work" | "hire_talent"
  isLoggedIn: boolean
  findWorkType?: string | null  // "freelancer" | "job_seeker" | "both"
}

const BENEFITS = {
  freelancer: [
    "Apply to unlimited projects",
    "Gig stays listed & visible",
    "Profile in freelancer search",
    "Direct client messages",
  ],
  job_seeker: [
    "Apply to unlimited jobs",
    "Resume seen by top companies",
    "Profile in job seeker search",
    "Priority application badge",
  ],
  both: [
    "Apply to unlimited jobs & projects",
    "Gig stays listed & visible",
    "Profile in all search results",
    "Priority application badge",
  ],
  hire_talent: [
    "Post unlimited jobs",
    "Post unlimited projects",
    "Access full CV database",
    "Verified Company badge",
    "Featured listings",
  ],
}

const TESTIMONIALS = {
  freelancer: `💬 "Rahul from Delhi paid ₹49 and got a ₹8,000 project in 3 days"`,
  job_seeker: `💬 "Priya from Mumbai paid ₹49 and got an interview call in 2 days"`,
  both:       `💬 "Arjun from Bengaluru paid ₹49, got a freelance gig + a full-time offer in a week"`,
  hire_talent:`💬 "TechCorp posted a job for ₹199 and got 47 qualified applications in 24 hours"`,
}

export default function PlanCard({ type, isLoggedIn, findWorkType }: Props) {
  const isFindWork = type === "find_work"

  const fwKey = (findWorkType === "job_seeker" || findWorkType === "both" || findWorkType === "freelancer")
    ? findWorkType
    : "freelancer"

  const benefitsKey = isFindWork ? fwKey : "hire_talent"
  const testimonial = TESTIMONIALS[benefitsKey]
  const benefits    = BENEFITS[benefitsKey]

  const planTitle = isFindWork
    ? fwKey === "job_seeker"
      ? "⚡ Job Seeker Plan"
      : fwKey === "both"
      ? "⚡ Find Work Plan"
      : "⚡ Find Work Plan"
    : "🚀 Hire Talent Plan"

  return (
    <div
      className={`bg-gradient-to-br from-[#1A1A2E] to-[#12121A] border-2 rounded-2xl p-6 mb-6 ${
        isFindWork ? "border-[#6366F1]/50" : "border-[#F59E0B]/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white font-black text-lg">{planTitle}</p>
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
          {testimonial}
        </p>
      </div>

      {/* Benefits */}
      <ul className="space-y-2.5 mb-6">
        {benefits.map(b => (
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
