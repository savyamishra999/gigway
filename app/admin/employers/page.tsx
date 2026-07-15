import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Building2 } from "lucide-react"
import AdminEmployersClient, { type EmployerRow } from "@/components/admin/AdminEmployersClient"

export const metadata: Metadata = { title: "Admin — Employers — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())
const PAGE_SIZE = 20

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type TabFilter = "all" | "verified" | "unverified" | "active_plan" | "banned"
interface SearchParams { tab?: string; page?: string; q?: string }

const TABS: { key: TabFilter; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "verified",    label: "Verified ✅" },
  { key: "unverified",  label: "Unverified" },
  { key: "active_plan", label: "Active Plan" },
  { key: "banned",      label: "Banned" },
]

export default async function AdminEmployersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const params = await searchParams
  const tab    = (params.tab ?? "all") as TabFilter
  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const q      = params.q?.trim() ?? ""
  const offset = (page - 1) * PAGE_SIZE
  const now    = new Date().toISOString()

  // Stat counts
  const [
    { count: totalEmployers },
    { count: verifiedCount },
    { count: activePlanCount },
    { count: totalJobs },
  ] = await Promise.all([
    adminDb.from("profiles").select("id", { count: "exact", head: true }).contains("user_roles", ["hire_talent"]),
    adminDb.from("profiles").select("id", { count: "exact", head: true })
      .contains("user_roles", ["hire_talent"]).eq("is_employer_verified", true),
    adminDb.from("profiles").select("id", { count: "exact", head: true })
      .contains("user_roles", ["hire_talent"]).eq("plan", "hire_talent").gt("plan_expires_at", now),
    adminDb.from("jobs").select("id", { count: "exact", head: true }),
  ])

  // Build main query — hire_talent users only
  let query = adminDb
    .from("profiles")
    .select(
      "id,full_name,email,company_name,company_size,account_type,is_employer_verified,is_banned,plan,plan_expires_at,created_at",
      { count: "exact" }
    )
    .contains("user_roles", ["hire_talent"])

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%`)
  if (tab === "verified")    query = query.eq("is_employer_verified", true)
  else if (tab === "unverified")  query = query.eq("is_employer_verified", false)
  else if (tab === "active_plan") query = query.eq("plan", "hire_talent").gt("plan_expires_at", now)
  else if (tab === "banned")      query = query.eq("is_banned", true)

  const { data: raw, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  // Count jobs per employer (batch)
  const ids = (raw ?? []).map(e => e.id)
  let jobCounts: Record<string, number> = {}

  if (ids.length > 0) {
    const { data: jobRows } = await adminDb
      .from("jobs")
      .select("client_id")
      .in("client_id", ids)
    for (const row of jobRows ?? []) {
      jobCounts[row.client_id] = (jobCounts[row.client_id] ?? 0) + 1
    }
  }

  const employers: EmployerRow[] = (raw ?? []).map(e => ({
    id: e.id,
    full_name: e.full_name,
    email: e.email,
    company_name: e.company_name,
    company_size: e.company_size,
    account_type: e.account_type,
    is_employer_verified: e.is_employer_verified,
    is_banned: e.is_banned,
    plan: e.plan,
    plan_expires_at: e.plan_expires_at,
    jobs_count: jobCounts[e.id] ?? 0,
    created_at: e.created_at,
  }))

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function tabUrl(t: TabFilter) {
    const sp = new URLSearchParams()
    if (t !== "all") sp.set("tab", t)
    if (q) sp.set("q", q)
    return `/admin/employers${sp.toString() ? `?${sp.toString()}` : ""}`
  }

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (tab !== "all") sp.set("tab", tab)
    if (q) sp.set("q", q)
    if (p > 1) sp.set("page", String(p))
    return `/admin/employers${sp.toString() ? `?${sp.toString()}` : ""}`
  }

  const stats = [
    { label: "Total Employers",    value: totalEmployers ?? 0,  color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
    { label: "Verified Companies", value: verifiedCount ?? 0,   color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
    { label: "Active Plan",        value: activePlanCount ?? 0, color: "text-[#818CF8]", bg: "bg-[#4F46E5]/10" },
    { label: "Total Jobs Posted",  value: totalJobs ?? 0,       color: "text-[#F97316]", bg: "bg-[#F97316]/10" },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Employers</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">{(count ?? 0).toLocaleString()} Hire Talent users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Building2 className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
              <p className="text-[#6B7280] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <form method="GET" action="/admin/employers" className="flex gap-3">
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email or company..."
            className="flex-1 bg-[#12121A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
          <button type="submit"
            className="px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-colors">
            Search
          </button>
          {q && (
            <Link href={tabUrl(tab)}
              className="px-4 py-2.5 border border-[#1E1E2E] text-[#6B7280] text-sm rounded-xl hover:text-white hover:border-[#334155] transition-colors">
              Clear
            </Link>
          )}
        </form>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <Link key={t.key} href={tabUrl(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
              }`}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <AdminEmployersClient initial={employers} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[#6B7280] text-xs">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageUrl(page - 1)}
                  className="px-4 py-2 border border-[#1E1E2E] text-[#6B7280] text-sm rounded-xl hover:text-white hover:border-[#334155] transition-colors">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageUrl(page + 1)}
                  className="px-4 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-colors">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
