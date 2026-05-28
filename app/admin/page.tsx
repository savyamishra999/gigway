import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Users, Zap, Shield, DollarSign, ChevronRight, AlertCircle, TrendingUp, Gift } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Dashboard — GigWay",
  description: "GigWay admin dashboard",
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalUsers },
    { count: activeBoosted },
    { count: verifiedBadges },
    { count: pendingVerifications },
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
    supabase.from("profiles").select("id,full_name,email,created_at,is_boosted,is_verified")
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("support_tickets").select("id,name,subject,status,created_at")
      .order("created_at", { ascending: false }).limit(10),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    activeBoosted: activeBoosted ?? 0,
    verifiedBadges: verifiedBadges ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    recentUsers: recentUsers ?? [],
    recentTickets: recentTickets ?? [],
  }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/")
  }

  const stats = await getStats(supabase)

  const statCards = [
    { label: "Total Users",         value: stats.totalUsers,          icon: Users,       color: "text-[#818CF8]", bg: "bg-[#4F46E5]/10" },
    { label: "Active Boosts",       value: stats.activeBoosted,       icon: Zap,         color: "text-[#F97316]", bg: "bg-[#F97316]/10" },
    { label: "Verified Badges",     value: stats.verifiedBadges,      icon: Shield,      color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: AlertCircle, color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10" },
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
            <Link href="/admin/verifications"
              className="flex items-center gap-2 bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#FBBF24]/20 transition-colors">
              <AlertCircle className="h-4 w-4" />
              Verifications {stats.pendingVerifications > 0 && `(${stats.pendingVerifications})`}
            </Link>
            <Link href="/admin/users"
              className="flex items-center gap-2 bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-[#818CF8] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#4F46E5]/20 transition-colors">
              <Users className="h-4 w-4" /> Users
            </Link>
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

        {/* Recent activity — two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent users */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
              <h2 className="text-white font-bold text-sm">Recent Users</h2>
              <Link href="/admin/users" className="text-[#818CF8] text-xs hover:text-white transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {stats.recentUsers.length === 0 ? (
                <p className="text-[#475569] text-sm px-5 py-8 text-center">No users yet</p>
              ) : stats.recentUsers.map((u: Record<string, unknown>) => (
                <div key={u.id as string} className="flex items-center justify-between px-5 py-3 hover:bg-white/2">
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

          {/* Recent support tickets */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
              <h2 className="text-white font-bold text-sm">Support Tickets</h2>
              <DollarSign className="h-4 w-4 text-[#475569]" />
            </div>
            <div className="divide-y divide-[#1E1E2E]">
              {stats.recentTickets.length === 0 ? (
                <p className="text-[#475569] text-sm px-5 py-8 text-center">No tickets yet</p>
              ) : stats.recentTickets.map((t: Record<string, unknown>) => (
                <div key={t.id as string} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.name as string}</p>
                    <p className="text-[#475569] text-xs truncate">{t.subject as string}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      t.status === "open" ? "bg-[#FBBF24]/10 text-[#FBBF24]"
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
