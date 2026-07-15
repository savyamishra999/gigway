import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Users } from "lucide-react"
import AdminUsersClient from "@/components/admin/AdminUsersClient"

export const metadata: Metadata = {
  title: "Admin — Users — GigWay",
  description: "Manage GigWay users",
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())
const PAGE_SIZE = 20

type Filter = "all" | "boosted" | "verified" | "new" | "freelancer" | "job_seeker" | "individual" | "company"
interface SearchParams { filter?: string; page?: string; q?: string }

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const db = hasServiceRole
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : supabase

  const params = await searchParams
  const filter = (params.filter ?? "all") as Filter
  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const q      = params.q?.trim() ?? ""
  const offset = (page - 1) * PAGE_SIZE

  let query = db
    .from("profiles")
    .select(
      "id,full_name,email,phone,created_at,is_boosted,is_verified,verification_status,boost_expires_at,subscription_tier,user_roles,find_work_type,hire_talent_type,plan,plan_expires_at",
      { count: "exact" }
    )

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  if (filter === "boosted")      query = query.eq("is_boosted", true).gt("boost_expires_at", new Date().toISOString())
  else if (filter === "verified") query = query.eq("is_verified", true)
  else if (filter === "new") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gt("created_at", sevenDaysAgo)
  }
  else if (filter === "freelancer")  query = query.contains("user_roles", ["find_work"]).in("find_work_type", ["freelancer", "both"])
  else if (filter === "job_seeker")  query = query.contains("user_roles", ["find_work"]).in("find_work_type", ["job_seeker", "both"])
  else if (filter === "individual")  query = query.contains("user_roles", ["hire_talent"]).eq("hire_talent_type", "individual")
  else if (filter === "company")     query = query.contains("user_roles", ["hire_talent"]).eq("hire_talent_type", "company")

  const { data: users, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const TABS: { key: Filter; label: string; group?: string }[] = [
    { key: "all",       label: "All" },
    { key: "boosted",   label: "Boosted" },
    { key: "verified",  label: "Verified" },
    { key: "new",       label: "New (7d)" },
    { key: "freelancer", label: "Freelancer",  group: "role" },
    { key: "job_seeker", label: "Job Seeker",  group: "role" },
    { key: "individual", label: "Individual",  group: "role" },
    { key: "company",    label: "Company",     group: "role" },
  ]

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (filter !== "all") sp.set("filter", filter)
    if (q) sp.set("q", q)
    if (p > 1) sp.set("page", String(p))
    const s = sp.toString()
    return `/admin/users${s ? `?${s}` : ""}`
  }

  function filterUrl(f: Filter) {
    const sp = new URLSearchParams()
    if (f !== "all") sp.set("filter", f)
    if (q) sp.set("q", q)
    const s = sp.toString()
    return `/admin/users${s ? `?${s}` : ""}`
  }

  const statusTabs = TABS.filter(t => !t.group)
  const roleTabs   = TABS.filter(t => t.group === "role")

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Users</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">{(count ?? 0).toLocaleString()} total</p>
          </div>
        </div>

        <form method="GET" action="/admin/users" className="flex gap-3">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email or phone…"
            className="flex-1 bg-[#12121A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
          <button type="submit"
            className="px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-colors">
            Search
          </button>
          {q && (
            <Link href={filterUrl(filter)}
              className="px-4 py-2.5 border border-[#1E1E2E] text-[#6B7280] text-sm rounded-xl hover:text-white hover:border-[#334155] transition-colors">
              Clear
            </Link>
          )}
        </form>

        {/* Status filters */}
        <div className="space-y-2">
          <p className="text-[#475569] text-xs uppercase tracking-wider font-semibold">Filter by status</p>
          <div className="flex gap-2 flex-wrap">
            {statusTabs.map(tab => (
              <Link key={tab.key} href={filterUrl(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-[#4F46E5] text-white"
                    : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
                }`}>
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Role type filters */}
        <div className="space-y-2">
          <p className="text-[#475569] text-xs uppercase tracking-wider font-semibold">Filter by role type</p>
          <div className="flex gap-2 flex-wrap">
            {roleTabs.map(tab => {
              const colors: Record<string, string> = {
                freelancer: "bg-[#6366F1] text-white",
                job_seeker: "bg-[#378ADD] text-white",
                individual: "bg-[#F59E0B] text-black",
                company:    "bg-[#F97316] text-black",
              }
              return (
                <Link key={tab.key} href={filterUrl(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? (colors[tab.key] ?? "bg-[#4F46E5] text-white")
                      : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
                  }`}>
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>

        <AdminUsersClient initial={users ?? []} />

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
