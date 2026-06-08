import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Users, Zap, Shield, DollarSign, ChevronRight,
  AlertCircle, TrendingUp, Gift, Clock,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Dashboard — GigWay",
  description: "GigWay admin dashboard",
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return "just now"
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    redirect("/")
  }

  const [
    { count: totalUsers },
    { count: activeBoosted },
    { count: verifiedBadges },
    { count: pendingCount },
    { data: pendingList },
    { data: recentUsers },
    { data: recentTickets },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("is_boosted", true).gt("boost_expires_at", new Date().toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("is_verified", true),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase.from("profiles")
      .select("id,full_name,email,created_at,verification_paid_at")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("profiles")
      .select("id,full_name,email,created_at,is_boosted,is_verified")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("support_tickets")
      .select("id,name,subject,status,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const statCards = [
    { label: "Total Users",          value: totalUsers ?? 0,   icon: Users,       color: "text-[#818CF8]", bg: "bg-[#4F46E5]/10" },
    { label: "Active Boosts",        value: activeBoosted ?? 0, icon: Zap,        color: "text-[#F97316]", bg: "bg-[#F97316]/10" },
    { label: "Verified Badges",      value: verifiedBadges ?? 0, icon: Shield,    color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
    { label: "Pending Verifications",value: pendingCount ?? 0,  icon: AlertCircle, color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10" },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#4F46E5] text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-2xl font-black text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/revenue"
              className="flex items-center gap-2 bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#4ADE80]/20 transition-colors">
              <TrendingUp className="h-4 w-4" /> Revenue
            </Link>
            <Link href="/admin/affiliates"
              className="flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#F97316]/20 transition-colors">
              <Gift className="h-4 w-4" /> Affiliates
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-black text-white">{card.value.toLocaleString()}</p>
              <p className="text-[#6B7280] text-xs mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Pending Verifications list ─────────────────────────────── */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FBBF24]" />
              <h2 className="text-white font-bold text-sm">
                Pending Verifications
                {(pendingCount ?? 0) > 0 && (
                  <span className="ml-2 bg-[#FBBF24]/20 text-[#FBBF24] text-xs font-black px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </h2>
            </div>
            <Link href="/admin/verifications"
              className="text-[#818CF8] text-xs hover:text-white transition-colors flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {!pendingList || pendingList.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="w-8 h-8 rounded-full bg-[#4ADE80]/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#4ADE80]" />
              </div>
              <p className="text-[#475569] text-sm">No pending verifications — all clear ✅</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E2E]">
              {pendingList.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#FBBF24]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#FBBF24] font-black text-xs">
                        {p.full_name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {p.full_name || "Unnamed User"}
                      </p>
                      <p className="text-[#475569] text-xs truncate">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-[#6B7280] text-xs hidden sm:block">
                      {timeAgo(p.created_at)}
                    </span>
                    <Link
                      href="/admin/verifications"
                      className="text-xs bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] px-3 py-1.5 rounded-xl hover:bg-[#FBBF24]/20 transition-colors font-semibold whitespace-nowrap"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity — two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent users */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
              <h2 className="text-white font-bold text-sm">Recent Users</h2>
              <Link href="/admin/users"
                className="text-[#818CF8] text-xs hover:text-white transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {(recentUsers ?? []).length === 0 ? (
                <p className="text-[#475569] text-sm px-5 py-8 text-center">No users yet</p>
              ) : (recentUsers ?? []).map((u: Record<string, unknown>) => (
                <div key={u.id as string} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02]">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{(u.full_name as string) || "—"}</p>
                    <p className="text-[#475569] text-xs truncate">{u.email as string}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {!!u.is_boosted && <span className="text-[10px] bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full font-semibold">Boosted</span>}
                    {!!u.is_verified && <span className="text-[10px] bg-[#4ADE80]/10 text-[#4ADE80] px-2 py-0.5 rounded-full font-semibold">Verified</span>}
                    <span className="text-[#475569] text-xs">{fmt(u.created_at as string)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support tickets */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
              <h2 className="text-white font-bold text-sm">Support Tickets</h2>
              <Link href="/admin/support"
                className="text-[#818CF8] text-xs hover:text-white transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {(recentTickets ?? []).length === 0 ? (
                <p className="text-[#475569] text-sm px-5 py-8 text-center">No tickets yet</p>
              ) : (recentTickets ?? []).map((t: Record<string, unknown>) => (
                <div key={t.id as string} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.name as string}</p>
                    <p className="text-[#475569] text-xs truncate">{t.subject as string}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      t.status === "open"        ? "bg-[#FBBF24]/10 text-[#FBBF24]"
                      : t.status === "in_progress" ? "bg-[#818CF8]/10 text-[#818CF8]"
                      : "bg-[#4ADE80]/10 text-[#4ADE80]"
                    }`}>
                      {(t.status as string).replace("_", " ")}
                    </span>
                    <span className="text-[#475569] text-xs">{fmt(t.created_at as string)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
