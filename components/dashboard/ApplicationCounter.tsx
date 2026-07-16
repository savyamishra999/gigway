"use client"

import { Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Props {
  used: number
  limit: number
  type: "applications" | "proposals" | "messages"
}

const LABELS: Record<Props["type"], { singular: string; plural: string; href: string }> = {
  applications: { singular: "job application", plural: "job applications", href: "/jobs" },
  proposals:    { singular: "project proposal", plural: "project proposals", href: "/projects" },
  messages:     { singular: "message",          plural: "messages",          href: "/messages" },
}

export default function ApplicationCounter({ used, limit, type }: Props) {
  const pct   = Math.min((used / limit) * 100, 100)
  const left  = Math.max(limit - used, 0)
  const info  = LABELS[type]
  const isFull = used >= limit

  const barColor = pct >= 80
    ? "bg-red-500"
    : pct >= 60
    ? "bg-[#F97316]"
    : "bg-[#4F46E5]"

  return (
    <div className={`rounded-2xl border p-5 ${isFull ? "border-red-500/30 bg-red-500/5" : "border-[#1E1E2E] bg-[#12121A]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${isFull ? "text-red-400" : "text-[#F59E0B]"}`} />
          <p className="text-white font-bold text-sm">
            Free {info.plural}
          </p>
        </div>
        <span className={`text-xs font-black ${isFull ? "text-red-400" : pct >= 60 ? "text-[#F97316]" : "text-[#6B7280]"}`}>
          {used}/{limit} used
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isFull ? (
        <div className="flex items-center justify-between">
          <p className="text-red-400 text-xs font-semibold">
            Monthly limit reached — upgrade for unlimited
          </p>
          <Link href="/pricing"
            className="flex items-center gap-1 text-xs font-black text-white bg-[#4F46E5] px-3 py-1.5 rounded-lg hover:bg-[#4338CA] transition-colors">
            Upgrade <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <p className={`text-xs ${left <= 2 ? "text-[#F97316] font-semibold" : "text-[#6B7280]"}`}>
          {left <= 2
            ? `⚠️ Only ${left} free ${left === 1 ? info.singular : info.plural} left this month!`
            : `${left} free ${info.plural} remaining this month`}
        </p>
      )}
    </div>
  )
}
