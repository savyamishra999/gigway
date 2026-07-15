import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { ArrowLeft, TrendingUp, Zap, Shield, DollarSign, Download } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin — Revenue — GigWay",
  description: "GigWay revenue dashboard",
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LABELS: Record<string, string> = {
  boost_basic:          "Boost Basic",
  boost_standard:       "Boost Standard ⭐",
  boost_premium:        "Boost Premium",
  verified_badge:       "Verified Badge ✅",
  employer_verified:    "Employer Verified",
  connects_20:          "Connects × 20",
  connects_60:          "Connects × 60",
  connects_150:         "Connects × 150",
  connects_10:          "Connects × 10",
  connects_25:          "Connects × 25",
  connects_50:          "Connects × 50",
  resume_builder:       "Resume Builder 📄",
  priority_application: "Priority Application ⚡",
  profile_review:       "Profile Review 🔍",
  job_alerts:           "Job Alerts 🔔",
  featured_gig:         "Featured Gig 🌟",
  quick_apply_pack:     "Quick Apply Pack 🚀",
  pro:                  "Pro",
  business:             "Business",
  flash_5:              "Flash Deal × 5",
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

type FilterPeriod = "week" | "month" | "all"
interface SearchParams { period?: string }

function getPeriodStart(period: FilterPeriod): string | null {
  const now = new Date()
  if (period === "week") {
    const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString()
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  return null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function planColor(plan: string) {
  if (plan.startsWith("boost"))      return "bg-[#F97316]/10 text-[#F97316]"
  if (plan === "verified_badge")     return "bg-[#4ADE80]/10 text-[#4ADE80]"
  if (plan.startsWith("connects"))   return "bg-[#06B6D4]/10 text-[#06B6D4]"
  return "bg-[#818CF8]/10 text-[#818CF8]"
}

export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const params     = await searchParams
  const period     = (params.period ?? "all") as FilterPeriod
  const periodStart = getPeriodStart(period)

  // All payments (service role bypasses RLS)
  const { data: allPayments } = await adminDb
    .from("payments")
    .select("id, plan, amount, created_at, user_id")
    .in("status", ["success", "captured", "paid"])

  const all = allPayments ?? []

  const monthStart     = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const allRevenue     = all.reduce((s, p) => s + p.amount, 0)
  const thisMonthRev   = all.filter(p => p.created_at >= monthStart).reduce((s, p) => s + p.amount, 0)
  const boostRevenue   = all.filter(p => p.plan.startsWith("boost")).reduce((s, p) => s + p.amount, 0)
  const verifiedRev    = all.filter(p => p.plan === "verified_badge").reduce((s, p) => s + p.amount, 0)

  // Filtered transactions with profile join
  let txQuery = adminDb
    .from("payments")
    .select("id, plan, amount, razorpay_payment_id, razorpay_order_id, created_at, user_id, profiles:user_id(full_name, email)")
    .in("status", ["success", "captured", "paid"])

  if (periodStart) txQuery = txQuery.gte("created_at", periodStart)

  const { data: transactions } = await txQuery
    .order("created_at", { ascending: false })
    .limit(200)

  const txList = (transactions ?? []) as unknown as Array<{
    id: string
    plan: string
    amount: number
    razorpay_payment_id: string
    razorpay_order_id: string
    created_at: string
    profiles: { full_name: string | null; email: string } | null
  }>

  const filteredTotal = txList.reduce((s, t) => s + t.amount, 0)

  const statCards = [
    { label: "Total Revenue",    value: `₹${allRevenue.toLocaleString("en-IN")}`,     icon: TrendingUp, color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
    { label: "This Month",       value: `₹${thisMonthRev.toLocaleString("en-IN")}`,   icon: DollarSign, color: "text-[#818CF8]", bg: "bg-[#4F46E5]/10" },
    { label: "Boost Revenue",    value: `₹${boostRevenue.toLocaleString("en-IN")}`,   icon: Zap,        color: "text-[#F97316]", bg: "bg-[#F97316]/10" },
    { label: "Verified Revenue", value: `₹${verifiedRev.toLocaleString("en-IN")}`,    icon: Shield,     color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10" },
  ]

  const TABS: { key: FilterPeriod; label: string }[] = [
    { key: "week",  label: "This Week"  },
    { key: "month", label: "This Month" },
    { key: "all",   label: "All Time"   },
  ]

  // Live feed: last 20 transactions
  const liveFeed = txList.slice(0, 20)

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
              <p className="text-[#6B7280] text-xs mt-0.5">
                {txList.length} transactions · ₹{filteredTotal.toLocaleString("en-IN")} in selected period
              </p>
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
        {liveFeed.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1E1E2E]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-bold text-sm">LIVE</span>
              <span className="text-[#6B7280] text-xs ml-1">— recent payments</span>
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {liveFeed.map(item => {
                const name = (item.profiles as { full_name: string | null; email: string } | null)?.full_name
                          || (item.profiles as { full_name: string | null; email: string } | null)?.email
                          || "Unknown"
                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.plan.startsWith("boost") ? "bg-[#F97316]" : item.plan === "verified_badge" ? "bg-[#4ADE80]" : "bg-[#818CF8]"}`} />
                      <div>
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-[#6B7280] text-xs">{PLAN_LABELS[item.plan] ?? item.plan}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-white font-bold text-sm">₹{item.amount.toLocaleString("en-IN")}</p>
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
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden lg:table-cell">Payment ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E2E]">
                  {txList.map(tx => {
                    const profile = tx.profiles as { full_name: string | null; email: string } | null
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-white font-medium text-sm truncate max-w-[140px]">{profile?.full_name || "—"}</p>
                          <p className="text-[#475569] text-xs truncate max-w-[140px]">{profile?.email || ""}</p>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planColor(tx.plan)}`}>
                            {PLAN_LABELS[tx.plan] ?? tx.plan}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-white font-bold">₹{tx.amount.toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-3 py-3 text-[#6B7280] text-xs hidden md:table-cell">{fmt(tx.created_at)}</td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-[#475569] text-xs font-mono truncate max-w-[160px] block">{tx.razorpay_payment_id}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
