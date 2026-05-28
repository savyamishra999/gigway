"use client"

import { useState } from "react"
import { Copy, Check, MousePointer, ShoppingBag, IndianRupee, TrendingUp, X } from "lucide-react"

interface Affiliate {
  id: string
  ref_code: string
  name: string
  email: string
  total_earnings: number
}

interface Stats {
  totalClicks: number
  totalSales: number
  totalEarned: number
  thisMonthEarned: number
  available: number
  paidOut: number
}

interface Conversion {
  sale_amount: number
  commission: number
  created_at: string
}

interface Payout {
  amount: number
  upi_id: string | null
  status: string
  paid_at: string | null
  created_at: string
}

interface Props {
  affiliate: Affiliate
  stats: Stats
  conversions: Conversion[]
  payouts: Payout[]
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default function AffiliateDashboardClient({ affiliate, stats, conversions, payouts }: Props) {
  const [copied, setCopied] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [upiId, setUpiId] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState("")
  const [withdrawDone, setWithdrawDone] = useState(false)

  const refLink = `https://gigway.in/?ref=${affiliate.ref_code}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawError("")
    const amount = parseInt(withdrawAmount)
    if (!upiId.trim()) { setWithdrawError("Enter your UPI ID"); return }
    if (isNaN(amount) || amount < 500) { setWithdrawError("Minimum payout is ₹500"); return }
    if (amount > stats.available) { setWithdrawError(`Max available: ₹${stats.available}`); return }

    setWithdrawLoading(true)
    try {
      const res = await fetch("/api/affiliate/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_id: upiId.trim(), amount }),
      })
      const data = await res.json()
      if (!res.ok) { setWithdrawError(data.error || "Failed"); return }
      setWithdrawDone(true)
    } catch {
      setWithdrawError("Network error. Try again.")
    } finally {
      setWithdrawLoading(false)
    }
  }

  const statCards = [
    { label: "Total Clicks",     value: stats.totalClicks.toLocaleString(),    icon: MousePointer, color: "text-[#818CF8]",  bg: "bg-[#4F46E5]/10" },
    { label: "Total Sales",      value: stats.totalSales.toLocaleString(),      icon: ShoppingBag,  color: "text-[#F97316]",  bg: "bg-[#F97316]/10" },
    { label: "This Month ₹",     value: `₹${stats.thisMonthEarned}`,            icon: TrendingUp,   color: "text-[#4ADE80]",  bg: "bg-[#4ADE80]/10" },
    { label: "Total Earned ₹",   value: `₹${stats.totalEarned}`,               icon: IndianRupee,  color: "text-[#FBBF24]",  bg: "bg-[#FBBF24]/10" },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-[#4ADE80] text-xs font-semibold uppercase tracking-widest mb-1">Affiliate Dashboard</p>
          <h1 className="text-2xl font-black text-white">Welcome, {affiliate.name.split(" ")[0]}</h1>
        </div>

        {/* Referral link */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <p className="text-white font-bold mb-1">Your Referral Link</p>
          <p className="text-[#6B7280] text-xs mb-4">Share and earn 20% on every sale!</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-[#94A3B8] text-sm font-mono truncate">
              {refLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="mt-4 bg-[#4ADE80]/5 border border-[#4ADE80]/20 rounded-xl p-4">
            <p className="text-[#4ADE80] font-bold text-xs mb-2">Commission breakdown</p>
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div><p className="text-[#6B7280]">Boost sold</p><p className="text-white font-bold">You earn ₹40</p></div>
              <div><p className="text-[#6B7280]">Verified sold</p><p className="text-white font-bold">You earn ₹60</p></div>
              <div><p className="text-[#6B7280]">Monthly renewal</p><p className="text-white font-bold">₹40 / month</p></div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="text-xl font-black text-white">{card.value}</p>
              <p className="text-[#6B7280] text-xs mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Withdrawal section */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <p className="text-white font-bold">Withdraw Earnings</p>
              <p className="text-[#6B7280] text-xs mt-0.5">Min ₹500 · Paid to UPI within 48 hours</p>
            </div>
            <div className="text-right">
              <p className="text-[#4ADE80] text-2xl font-black">₹{stats.available}</p>
              <p className="text-[#6B7280] text-xs">Available</p>
            </div>
          </div>
          {!showWithdraw ? (
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={stats.available < 500}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {stats.available < 500 ? `Need ₹${500 - stats.available} more to withdraw` : "Request Withdrawal →"}
            </button>
          ) : withdrawDone ? (
            <div className="text-center py-4">
              <p className="text-[#4ADE80] font-bold">Withdrawal requested!</p>
              <p className="text-[#6B7280] text-xs mt-1">We&apos;ll process within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3">
              <input
                type="text" required value={upiId} onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
              />
              <div className="flex gap-3">
                <input
                  type="number" required min={500} max={stats.available}
                  value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder={`Amount (max ₹${stats.available})`}
                  className="flex-1 bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
                />
                <button type="button" onClick={() => setShowWithdraw(false)}
                  className="p-3 border border-[#334155] rounded-xl text-[#6B7280] hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}
              <button type="submit" disabled={withdrawLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black font-black text-sm hover:opacity-90 disabled:opacity-50">
                {withdrawLoading ? "Requesting…" : "Confirm Withdrawal →"}
              </button>
            </form>
          )}
        </div>

        {/* Recent conversions */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E1E2E]">
            <h2 className="text-white font-bold text-sm">Recent Conversions</h2>
          </div>
          {conversions.length === 0 ? (
            <p className="text-[#475569] text-sm text-center py-10">No conversions yet — share your link to start earning!</p>
          ) : (
            <div className="divide-y divide-[#1E1E2E]">
              {conversions.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">Sale ₹{c.sale_amount}</p>
                    <p className="text-[#475569] text-xs">{fmt(c.created_at)}</p>
                  </div>
                  <span className="text-[#4ADE80] font-bold text-sm">+₹{c.commission}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout history */}
        {payouts.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E1E2E]">
              <h2 className="text-white font-bold text-sm">Payout History</h2>
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {payouts.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">₹{p.amount}</p>
                    <p className="text-[#475569] text-xs">{p.upi_id} · {fmt(p.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "paid"
                      ? "bg-[#4ADE80]/10 text-[#4ADE80]"
                      : "bg-[#FBBF24]/10 text-[#FBBF24]"
                  }`}>
                    {p.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
