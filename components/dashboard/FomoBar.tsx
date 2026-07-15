"use client"

import Link from "next/link"
import CountdownTimer from "@/components/ui/CountdownTimer"

interface Props {
  type: "find_work" | "hire_talent"
  planActive: boolean
  planExpiresAt?: string | null
}

export default function FomoBar({ type, planActive, planExpiresAt }: Props) {
  const expiresDate = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null

  if (planActive) {
    return (
      <div className="flex items-center justify-between bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-4 py-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse flex-shrink-0" />
          <p className="text-[#4ADE80] font-bold text-sm">
            ✅ Plan active — You&apos;re visible!
          </p>
          {expiresDate && (
            <span className="text-[#64748B] text-xs hidden sm:inline">
              · Expires {expiresDate}
            </span>
          )}
        </div>
        <Link href="/pricing" className="text-[#4ADE80] text-xs font-bold hover:underline flex-shrink-0">
          Renew →
        </Link>
      </div>
    )
  }

  if (type === "find_work") {
    return (
      <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 flex-shrink-0">🔴</span>
            <div>
              <p className="text-red-300 font-bold text-sm">
                16 professionals ahead of you in search results right now
              </p>
              <p className="text-[#64748B] text-xs mt-0.5">Get the plan to move to the top</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Link
              href="/pricing"
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Get ₹49 Plan →
            </Link>
            <CountdownTimer className="text-xs" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <div>
            <p className="text-[#FCD34D] font-bold text-sm">
              500+ freelancers waiting — your job post not visible yet
            </p>
            <p className="text-[#64748B] text-xs mt-0.5">Activate plan to post jobs &amp; projects</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Link
            href="/pricing"
            className="bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Post Now ₹199 →
          </Link>
          <CountdownTimer className="text-xs" />
        </div>
      </div>
    </div>
  )
}
