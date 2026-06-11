import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Briefcase } from "lucide-react"
import AdminJobsClient from "@/components/admin/AdminJobsClient"

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata: Metadata = { title: "Admin — Jobs — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())
const PAGE_SIZE = 20

type TypeFilter = "all" | "full_time" | "part_time" | "remote" | "internship" | "contract"
interface SearchParams { type?: string; page?: string; q?: string }

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const params = await searchParams
  const type   = (params.type ?? "all") as TypeFilter
  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const q      = params.q?.trim() ?? ""
  const offset = (page - 1) * PAGE_SIZE

  // FK is client_id, company column is company_name
  let query = adminDb
    .from("jobs")
    .select(
      `id, title, company_name, location, job_type, created_at,
       poster:client_id(full_name, email)`,
      { count: "exact" }
    )

  if (q)          query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%`)
  if (type !== "all") query = query.eq("job_type", type)

  const { data: raw, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  type JRow = {
    id: string; title: string; company_name: string | null; location: string | null
    job_type: string | null; created_at: string
    poster: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
  }

  const jobs = (raw as unknown as JRow[] ?? []).map(j => {
    const p = Array.isArray(j.poster) ? j.poster[0] : j.poster
    return { ...j, poster_name: p?.full_name ?? null, poster_email: p?.email ?? null }
  })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const TYPE_TABS: { key: TypeFilter; label: string }[] = [
    { key: "all",        label: "All" },
    { key: "full_time",  label: "Full-time" },
    { key: "part_time",  label: "Part-time" },
    { key: "remote",     label: "Remote" },
    { key: "internship", label: "Internship" },
    { key: "contract",   label: "Contract" },
  ]

  function tabUrl(t: TypeFilter) {
    const sp = new URLSearchParams()
    if (t !== "all") sp.set("type", t)
    if (q) sp.set("q", q)
    const s = sp.toString()
    return `/admin/jobs${s ? `?${s}` : ""}`
  }

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (type !== "all") sp.set("type", type)
    if (q) sp.set("q", q)
    if (p > 1) sp.set("page", String(p))
    const s = sp.toString()
    return `/admin/jobs${s ? `?${s}` : ""}`
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Jobs</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">{(count ?? 0).toLocaleString()} total</p>
          </div>
        </div>

        <form method="GET" action="/admin/jobs" className="flex gap-3">
          {type !== "all" && <input type="hidden" name="type" value={type} />}
          <input name="q" defaultValue={q} placeholder="Search by title or company..."
            className="flex-1 bg-[#12121A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]" />
          <button type="submit"
            className="px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-colors">
            Search
          </button>
          {q && (
            <Link href={tabUrl(type)}
              className="px-4 py-2.5 border border-[#1E1E2E] text-[#6B7280] text-sm rounded-xl hover:text-white hover:border-[#334155] transition-colors">
              Clear
            </Link>
          )}
        </form>

        <div className="flex gap-2 flex-wrap">
          {TYPE_TABS.map(t => (
            <Link key={t.key} href={tabUrl(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                type === t.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
              }`}>
              {t.label}
            </Link>
          ))}
        </div>

        <AdminJobsClient initial={jobs} />

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
