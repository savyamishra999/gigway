import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { ClipboardList } from "lucide-react"
import AdminApplicationsClient, { type AppRow } from "@/components/admin/AdminApplicationsClient"

export const metadata: Metadata = { title: "Admin — Applications — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())
const PAGE_SIZE = 25

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type StatusFilter = "all" | "applied" | "reviewing" | "shortlisted" | "interview" | "selected" | "rejected"
interface SearchParams { status?: string; page?: string; q?: string }

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "applied",     label: "🟡 Applied" },
  { key: "reviewing",   label: "🔵 Reviewing" },
  { key: "shortlisted", label: "🟣 Shortlisted" },
  { key: "interview",   label: "🟠 Interview" },
  { key: "selected",    label: "✅ Selected" },
  { key: "rejected",    label: "❌ Rejected" },
]

export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const params = await searchParams
  const status = (params.status ?? "all") as StatusFilter
  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const q      = params.q?.trim() ?? ""
  const offset = (page - 1) * PAGE_SIZE

  const now    = new Date()
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const week   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Stat counts — parallel
  const [
    { count: totalToday },
    { count: totalWeek },
    { count: pendingCount },
    { count: selectedCount },
  ] = await Promise.all([
    adminDb.from("job_applications").select("id", { count: "exact", head: true }).gte("created_at", today),
    adminDb.from("job_applications").select("id", { count: "exact", head: true }).gte("created_at", week),
    adminDb.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "applied"),
    adminDb.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "selected"),
  ])

  // Main query with joins
  type RawRow = {
    id: string; status: string; cover_letter: string; resume_url: string | null
    expected_salary: number | null; created_at: string
    applicant: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
    job: { title: string | null; company_name: string | null } | { title: string | null; company_name: string | null }[] | null
  }

  let query = adminDb
    .from("job_applications")
    .select(
      `id, status, cover_letter, resume_url, expected_salary, created_at,
       applicant:applicant_id(full_name, email),
       job:job_id(title, company_name)`,
      { count: "exact" }
    )

  if (status !== "all") query = query.eq("status", status)

  const { data: raw, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const applications: AppRow[] = ((raw ?? []) as unknown as RawRow[]).map(r => {
    const ap = Array.isArray(r.applicant) ? r.applicant[0] : r.applicant
    const jb = Array.isArray(r.job) ? r.job[0] : r.job

    // Search filter on applicant name or company (client-side since Supabase FK join can't be OR-filtered server-side easily)
    return {
      id: r.id,
      status: r.status,
      cover_letter: r.cover_letter,
      resume_url: r.resume_url,
      expected_salary: r.expected_salary,
      created_at: r.created_at,
      applicant_name: ap?.full_name ?? null,
      applicant_email: ap?.email ?? null,
      job_title: jb?.title ?? null,
      company_name: jb?.company_name ?? null,
    }
  }).filter(r => {
    if (!q) return true
    const search = q.toLowerCase()
    return (
      r.applicant_name?.toLowerCase().includes(search) ||
      r.applicant_email?.toLowerCase().includes(search) ||
      r.company_name?.toLowerCase().includes(search) ||
      r.job_title?.toLowerCase().includes(search)
    )
  })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function tabUrl(s: StatusFilter) {
    const sp = new URLSearchParams()
    if (s !== "all") sp.set("status", s)
    if (q) sp.set("q", q)
    return `/admin/applications${sp.toString() ? `?${sp.toString()}` : ""}`
  }

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (status !== "all") sp.set("status", status)
    if (q) sp.set("q", q)
    if (p > 1) sp.set("page", String(p))
    return `/admin/applications${sp.toString() ? `?${sp.toString()}` : ""}`
  }

  const stats = [
    { label: "Applied Today",   value: totalToday ?? 0,    color: "text-[#818CF8]", bg: "bg-[#4F46E5]/10" },
    { label: "This Week",       value: totalWeek ?? 0,     color: "text-[#F97316]", bg: "bg-[#F97316]/10" },
    { label: "Pending Review",  value: pendingCount ?? 0,  color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
    { label: "Selected",        value: selectedCount ?? 0, color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Applications</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">{(count ?? 0).toLocaleString()} total</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <span className={`text-base font-black ${s.color}`}>#</span>
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
              <p className="text-[#6B7280] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <form method="GET" action="/admin/applications" className="flex gap-3">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, job title or company..."
            className="flex-1 bg-[#12121A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
          <button type="submit"
            className="px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-colors">
            Search
          </button>
          {q && (
            <Link href={tabUrl(status)}
              className="px-4 py-2.5 border border-[#1E1E2E] text-[#6B7280] text-sm rounded-xl hover:text-white hover:border-[#334155] transition-colors">
              Clear
            </Link>
          )}
        </form>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <Link key={t.key} href={tabUrl(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                status === t.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
              }`}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <AdminApplicationsClient initial={applications} />

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
