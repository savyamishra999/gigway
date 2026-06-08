"use client"

import { useState } from "react"
import { Copy, Check, Gift, Users, Link2 } from "lucide-react"

interface Props {
  refCode: string
  name: string
  connectsBalance: number
  totalReferred: number
}

export default function ReferClient({ refCode, name, connectsBalance, totalReferred }: Props) {
  const [copied, setCopied] = useState(false)

  const referralLink = `https://gigway.in/?ref=${refCode}`

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center mx-auto mb-4">
          <Gift className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Refer & Earn</h1>
        <p className="text-[#94A3B8] text-sm">
          Refer a friend — both of you get <span className="text-[#4ADE80] font-bold">5 free connects</span> instantly!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
          <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-[#818CF8]" />
          </div>
          <p className="text-3xl font-black text-white">{totalReferred}</p>
          <p className="text-[#6B7280] text-xs mt-1">Friends Referred</p>
        </div>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
          <div className="w-10 h-10 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-2">
            <Link2 className="h-5 w-5 text-[#4ADE80]" />
          </div>
          <p className="text-3xl font-black text-white">{connectsBalance}</p>
          <p className="text-[#6B7280] text-xs mt-1">Connects Balance</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-4">
        <p className="text-white font-bold text-sm">Your Referral Link</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 flex items-center min-w-0">
            <span className="text-[#94A3B8] text-sm truncate">{referralLink}</span>
          </div>
          <button
            onClick={copy}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              copied
                ? "bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]"
                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-[#475569] text-xs">
          Your code: <span className="text-[#818CF8] font-mono font-bold">{refCode}</span>
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
        <p className="text-white font-bold text-sm mb-4">How it works</p>
        <ol className="space-y-3">
          {[
            "Share your referral link with a friend",
            "Friend signs up on GigWay using your link",
            "Both of you instantly get 5 free connects!",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5]/20 text-[#818CF8] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-[#94A3B8] text-sm">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-[#475569] text-xs text-center">
        Connects can be used to apply to projects. Each application costs 2 connects.
      </p>
    </div>
  )
}
