"use client"

import { Lock, Eye, MessageSquare, Briefcase, TrendingUp, ArrowRight } from "lucide-react"
import PayButton from "@/components/pricing/PayButton"

interface Props {
  profileViewsThisWeek: number
  messagesBlocked: number
  matchingOpportunities: number
  findWorkType?: string | null
  hireTalentType?: string | null
  planType: "find_work" | "hire_talent"
}

// PayButton actual props: plan, label, description, isLoggedIn, redirectTo, className

export default function MissedOpportunities({
  profileViewsThisWeek,
  messagesBlocked,
  matchingOpportunities,
  findWorkType,
  hireTalentType,
  planType,
}: Props) {
  const price       = planType === "find_work" ? "₹49" : "₹199"
  const planId      = planType === "find_work" ? "find_work_monthly" : "hire_talent_monthly"
  const redirectTo  = `/payment/success?plan=${planId}`

  const items = planType === "find_work"
    ? [
        {
          icon: <Eye className="h-5 w-5 text-[#818CF8]" />,
          bg: "bg-[#4F46E5]/10",
          count: profileViewsThisWeek,
          label: "people viewed your profile this week",
          locked: "See exactly who — upgrade to unlock",
        },
        {
          icon: <MessageSquare className="h-5 w-5 text-[#10B981]" />,
          bg: "bg-[#10B981]/10",
          count: messagesBlocked,
          label: "clients couldn't message you (no plan)",
          locked: "Unlock direct messages from clients",
        },
        {
          icon: <Briefcase className="h-5 w-5 text-[#F97316]" />,
          bg: "bg-[#F97316]/10",
          count: matchingOpportunities,
          label: "jobs/projects match your skills right now",
          locked: "Apply to all of them — unlimited with plan",
        },
      ]
    : [
        {
          icon: <Eye className="h-5 w-5 text-[#818CF8]" />,
          bg: "bg-[#4F46E5]/10",
          count: profileViewsThisWeek,
          label: "freelancers match your requirements",
          locked: "Contact them directly — upgrade to message",
        },
        {
          icon: <MessageSquare className="h-5 w-5 text-[#10B981]" />,
          bg: "bg-[#10B981]/10",
          count: messagesBlocked,
          label: "freelancers applied to your area this week",
          locked: "Post jobs & get proposals — unlock now",
        },
        {
          icon: <TrendingUp className="h-5 w-5 text-[#F97316]" />,
          bg: "bg-[#F97316]/10",
          count: matchingOpportunities,
          label: "companies already hired on GigWay this month",
          locked: "Join them — post unlimited jobs & projects",
        },
      ]

  return (
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-[#12121A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/15">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        <p className="text-white font-black text-sm">
          You're losing opportunities every day without a plan
        </p>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#1E1E2E]">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">
                <span className="text-[#818CF8]">{item.count}</span>{" "}
                {item.label}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Lock className="h-3 w-3 text-red-400" />
                <p className="text-red-400 text-xs">{item.locked}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#4F46E5]/10 to-[#F97316]/5 border-t border-[#1E1E2E] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[#9CA3AF] text-xs text-center sm:text-left">
          Stop losing clients to paid users. Start now for just{" "}
          <span className="text-white font-bold">{price}/month</span>
        </p>
        <PayButton
          plan={planId}
          label={`Unlock for ${price}/mo`}
          description="Unlock all features instantly"
          isLoggedIn={true}
          redirectTo={redirectTo}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white text-sm font-black rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-[#4F46E5]/30 flex-shrink-0"
        />
      </div>
    </div>
  )
}
