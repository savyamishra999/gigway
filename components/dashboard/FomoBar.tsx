"use client"

import { useState, useEffect } from "react"
import CountdownTimer from "@/components/ui/CountdownTimer"
import PayButton from "@/components/pricing/PayButton"
import Link from "next/link"

interface Props {
  type: "find_work" | "hire_talent"
  planActive: boolean
  planExpiresAt?: string | null
  findWorkType?: string | null    // "freelancer" | "job_seeker" | "both"
  hireTalentType?: string | null  // "individual" | "company"
}

const POOLS = {
  freelancer:  [11, 14, 17, 19, 23, 26, 29, 31, 34],
  job_seeker:  [8,  12, 15, 18, 21, 24, 27, 30, 33],
  both_fw:     [13, 16, 19, 22, 25, 28],
  individual:  [4,  6,  8,  10, 12, 15],
  company:     [3,  5,  7,  9,  12, 14],
}

function pickRandom(arr: number[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getPool(type: string, fwType?: string | null, htType?: string | null) {
  if (type === "find_work") {
    if (fwType === "job_seeker") return POOLS.job_seeker
    if (fwType === "both")       return POOLS.both_fw
    return POOLS.freelancer
  }
  if (htType === "individual") return POOLS.individual
  return POOLS.company
}

export default function FomoBar({ type, planActive, planExpiresAt, findWorkType, hireTalentType }: Props) {
  const pool = getPool(type, findWorkType, hireTalentType)
  const [ahead, setAhead] = useState(() => pickRandom(pool))

  useEffect(() => {
    const t = setInterval(() => setAhead(pickRandom(pool)), 9000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const expiresDate = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null

  /* ── Plan active — same for all roles ── */
  if (planActive) {
    return (
      <div className="flex items-center justify-between bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-4 py-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse flex-shrink-0" />
          <p className="text-[#4ADE80] font-bold text-sm">✅ Plan active — You&apos;re visible!</p>
          {expiresDate && (
            <span className="text-[#64748B] text-xs hidden sm:inline">· Expires {expiresDate}</span>
          )}
        </div>
        <Link href="/pricing" className="text-[#4ADE80] text-xs font-bold hover:underline flex-shrink-0">
          Renew →
        </Link>
      </div>
    )
  }

  /* ── Find Work ── */
  if (type === "find_work") {
    const headline =
      findWorkType === "job_seeker"
        ? `${ahead} job seekers ahead of you in company search lists right now`
        : findWorkType === "both"
        ? `${ahead} professionals ahead of you in search results right now`
        : `${ahead} freelancers ahead of you in project search results right now`

    const sub =
      findWorkType === "job_seeker"
        ? "Activate plan so companies find your profile first"
        : findWorkType === "both"
        ? "Get the plan to stay ahead in both freelance & job search"
        : "Get the plan to move to the top"

    return (
      <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 flex-shrink-0">🔴</span>
            <div>
              <p className="text-red-300 font-bold text-sm">{headline}</p>
              <p className="text-[#64748B] text-xs mt-0.5">{sub}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <PayButton
              plan="find_work_monthly"
              label="Get ₹49 Now →"
              description="GigWay Find Work — ₹49/month"
              isLoggedIn={true}
              redirectTo="/payment/success?plan=find_work_monthly"
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            />
            <CountdownTimer className="text-xs" />
          </div>
        </div>
      </div>
    )
  }

  /* ── Hire Talent: Individual ── */
  if (hireTalentType === "individual") {
    return (
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">⚠️</span>
            <div>
              <p className="text-[#FCD34D] font-bold text-sm">
                {ahead} clients already hiring freelancers — your project not live yet
              </p>
              <p className="text-[#64748B] text-xs mt-0.5">Activate plan to post your project &amp; get proposals</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <PayButton
              plan="hire_talent_monthly"
              label="Post Now ₹199 →"
              description="GigWay Hire Talent — ₹199/month"
              isLoggedIn={true}
              redirectTo="/payment/success?plan=hire_talent_monthly"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            />
            <CountdownTimer className="text-xs" />
          </div>
        </div>
      </div>
    )
  }

  /* ── Hire Talent: Company (default) ── */
  return (
    <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <div>
            <p className="text-[#FCD34D] font-bold text-sm">
              {ahead} companies already hiring — your job post not visible yet
            </p>
            <p className="text-[#64748B] text-xs mt-0.5">Activate plan to post jobs &amp; projects</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <PayButton
            plan="hire_talent_monthly"
            label="Post Now ₹199 →"
            description="GigWay Hire Talent — ₹199/month"
            isLoggedIn={true}
            redirectTo="/payment/success?plan=hire_talent_monthly"
            className="bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          />
          <CountdownTimer className="text-xs" />
        </div>
      </div>
    </div>
  )
}
