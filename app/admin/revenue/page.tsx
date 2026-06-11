import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, TrendingUp, Zap, Shield, DollarSign, Download } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin — Revenue — GigWay",
  description: "GigWay revenue dashboard",
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

// Amount in rupees derived from plan name (subscriptions table has no amount column)
const PLAN_AMOUNTS: Record<string, number> = {
  boost_basic:     99,
  boost_standard:  199,
  boost_premium:   299,
  verified_badge:  299,
  pro:             199,
  business:        999,
  connects_10:     99,
  connects_20:     99,
  connects_25:     199,
  connects_50:     349,
  connects_60:     249,
  connects_150:    499,
  flash_5:         49,
}

const PLAN_LABELS: Record<string, string> = {
  boost_basic:     "Boost Basic",
  boost_standard:  "Boost Standard ⭐",
  boost_premium:   "Boost Premium",
  verified_badge:  "Verified Badge ✅",
  pro:             "Pro",
  business:        "Business",
  connects_10:     "Connects × 10",
  connects_20:     "Connects × 20",
  connects_25:     "Connects × 25",
  connects_50:     "Connects × 50",
  connects_60:     "Connects × 60",
  connects_150:    "Connects × 150",
  flash_5:         "Flash Deal × 5",
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

type FilterPeriod = "week" | "month" | "all"

interface SearchParams { period?: string }

function getPeriodStart(period: FilterPeriod): string | null {
  const now = new Date()
  if (period === "week") {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  return null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const params = await searchParams
  const period = (params.period ?? "all") as FilterPeriod
  const periodStart = getPeriodStart(period)

  // Recent 20 purchases for live feed
  const { data: liveFeed } = await supabase
    .from("subscriptions")
    .select("id, plan, created_at, profiles:user_id(full_name, email)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)

  const liveFeedList = (liveFeed ?? []) as unknown as Array<{
    id: string
    plan: string
    created_at: string
    profiles: { full_name: string | null; email: string } | null
  }>

  // All-time aggregates (always full data for stat cards)
  const { data: allSubs } = await supabase
    .from("subscriptions")
    .select("plan, created_at")
    .eq("status", "active")

  const allRevenue = (allSubs ?? []).reduce((sum, s) => sum + (PLAN_AMOUNTS[s.plan] ?? 0), 0)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const thisMonthRevenue = (allSubs ?? [])
    .filter(s => s.created_at >= monthStart)
    .reduce((sum, s) => sum + (PLAN_AMOUNTS[s.plan] ?? 0), 0)
  const boostRevenue = (allSubs ?? [])
    .filter(s => s.plan.startsWith("boost"))
    .reduce((sum, s) => sum + (PLAN_AMOUNTS[s.plan] ?? 0), 0)
  const verifiedRevenue = (allSubs ?? [])
    .filter(s => s.plan === "verified_badge")
    .reduce((sum, s) => sum + (PLAN_AMOUNTS[s.plan] ?? 0), 0)

  // Filtered transactions for table
  let txQuery = supabase
    .from("subscriptions")
    .select("id, plan, payment_id, order_id, created_at, profiles:user_id(full_name, email)")
    .eq("status", "active")

  if (periodStart) txQuery = txQuery.gte("created_at", periodStart)

  const { data: transactions } = await txQuery
    .order("created_at", { ascending: false })
    .limit(200)

  const txList = (transactions ?? []) as unknown as Array<{
    id: string
    plan: string
    payment_id: string
    order_id: string
    created_at: string
    profiles: { full_name: string | null; email: string } | null
  }>

  const statCards = [
    { label: "Total Revenue",   value: `₹${allRevenue.toLocaleString("en-IN")}`,      icon: TrendingUp, color: "text-[#4ADE80]",  bg: "bg-[#4ADE80]/10" },
    { label: "This Month",      value: `₹${thisMonthRevenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-[#818CF8]",  bg: "bg-[#4F46E5]/10" },
    { label: "Boost Revenue",   value: `₹${boostRevenue.toLocaleString("en-IN")}`,     icon: Zap,        color: "text-[#F97316]",  bg: "bg-[#F97316]/10" },
    { label: "Verified Revenue",value: `₹${verifiedRevenue.toLocaleString("en-IN")}`,  icon: Shield,     color: "text-[#FBBF24]",  bg: "bg-[#FBBF24]/10" },
  ]

  const TABS: { key: FilterPeriod; label: string }[] = [
    { key: "week",  label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all",   label: "All Time" },
  ]

  const filteredTotal = txList.reduce((sum, t) => sum + (PLAN_AMOUNTS[t.plan] ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-[#6B7280] hover:text-white text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Revenue</h1>
              <p className="text-[#6B7280] text-xs mt-0.5">{txList.length} transactions · ₹{filteredTotal.toLocaleString("en-IN")} in selected period</p>
            </div>
          </div>
          <a
            href="/api/admin/revenue/export"
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-white text-sm font-semibold px-4 py-2 rounded-xl hover:border-[#4F46E5]/50 transition-all"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-black text-white">{card.value}</p>
              <p className="text-[#6B7280] text-xs mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* 🔴 Live purchase feed */}
        {liveFeedList.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1E1E2E]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-bold text-sm">LIVE</span>
              <span className="text-[#6B7280] text-xs ml-1">— recent purchases</span>
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {liveFeedList.map(item => {
                const amount = PLAN_AMOUNTS[item.plan] ?? 0
                const label  = PLAN_LABELS[item.plan] ?? item.plan
                const name   = item.profiles?.full_name || item.profiles?.email || "Unknown"
                const isBoost    = item.plan.startsWith("boost")
                const isVerified = item.plan === "verified_badge"
                const dotColor   = isBoost ? "bg-[#F97316]" : isVerified ? "bg-[#4ADE80]" : "bg-[#818CF8]"
                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <div>
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-[#6B7280] text-xs">{label}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-white font-bold text-sm">₹{amount.toLocaleString("en-IN")}</p>
                      <p className="text-[#475569] text-xs">{relativeTime(item.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Period filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <Link key={tab.key} href={`/admin/revenue?period=${tab.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === tab.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
              }`}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Transactions table */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          {txList.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <TrendingUp className="h-8 w-8 text-[#475569]" />
              <p className="text-[#475569] text-sm">No transactions in this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">User</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Plan</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Amount</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden lg:table-cell">Order ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E2E]">
                  {txList.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium text-sm truncate max-w-[140px]">
                          {tx.profiles?.full_name || "—"}
                        </p>
                        <p className="text-[#475569] text-xs truncate max-w-[140px]">
                          {tx.profiles?.email || ""}
                        </p>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          tx.plan.startsWith("boost")
                            ? "bg-[#F97316]/10 text-[#F97316]"
                            : tx.plan === "verified_badge"
                            ? "bg-[#4ADE80]/10 text-[#4ADE80]"
                            : "bg-[#818CF8]/10 text-[#818CF8]"
                        }`}>
                          {PLAN_LABELS[tx.plan] ?? tx.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-white font-bold">
                          ₹{(PLAN_AMOUNTS[tx.plan] ?? 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#6B7280] text-xs hidden md:table-cell">
                        {fmt(tx.created_at)}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className="text-[#475569] text-xs font-mono truncate max-w-[160px] block">
                          {tx.order_id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
