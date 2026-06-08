import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { FolderOpen } from "lucide-react"
import AdminProjectsClient from "@/components/admin/AdminProjectsClient"

export const metadata: Metadata = { title: "Admin — Projects — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())
const PAGE_SIZE = 20

type StatusFilter = "all" | "open" | "closed" | "in_progress"
interface SearchParams { status?: string; page?: string; q?: string }

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const params = await searchParams
  const status = (params.status ?? "all") as StatusFilter
  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const q      = params.q?.trim() ?? ""
  const offset = (page - 1) * PAGE_SIZE

  // FK is client_id (not user_id)
  let query = supabase
    .from("projects")
    .select(
      `id, title, budget_min, budget_max, status, created_at,
       client:client_id(full_name, email)`,
      { count: "exact" }
    )

  if (q)              query = query.ilike("title", `%${q}%`)
  if (status !== "all") query = query.eq("status", status)

  const { data: raw, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  type PRow = {
    id: string; title: string; budget_min: number | null; budget_max: number | null
    status: string | null; created_at: string
    client: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
  }

  const projects = (raw as unknown as PRow[] ?? []).map(p => {
    const c = Array.isArray(p.client) ? p.client[0] : p.client
    return { ...p, poster_name: c?.full_name ?? null, poster_email: c?.email ?? null }
  })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",         label: "All" },
    { key: "open",        label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "closed",      label: "Closed" },
  ]

  function tabUrl(s: StatusFilter) {
    const sp = new URLSearchParams()
    if (s !== "all") sp.set("status", s)
    if (q) sp.set("q", q)
    const str = sp.toString()
    return `/admin/projects${str ? `?${str}` : ""}`
  }

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (status !== "all") sp.set("status", status)
    if (q) sp.set("q", q)
    if (p > 1) sp.set("page", String(p))
    const str = sp.toString()
    return `/admin/projects${str ? `?${str}` : ""}`
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Projects</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">{(count ?? 0).toLocaleString()} total</p>
          </div>
        </div>

        <form method="GET" action="/admin/projects" className="flex gap-3">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search by title..."
            className="flex-1 bg-[#12121A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]" />
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

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <Link key={t.key} href={tabUrl(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                status === t.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
              }`}>
              {t.label}
            </Link>
          ))}
        </div>

        <AdminProjectsClient initial={projects} />

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
