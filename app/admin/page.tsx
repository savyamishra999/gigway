import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { adminViewer } from "@/lib/admin/access"
import { boundedFetch } from "@/lib/async"

export default async function AdminPage() {
  if (!(await adminViewer())) redirect("/")
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: boundedFetch } })
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  const head = (table: string) => db.from(table).select("id", { count: "exact", head: true })
  const stats = [
    { label: "Professional Profiles", href: "/admin/users", query: head("profiles") },
    { label: "New Profiles · 7 days", href: "/admin/users", query: head("profiles").gte("created_at", since) },
    { label: "Completed Profiles", href: "/admin/users", query: head("profiles").eq("profile_completed", true) },
    { label: "Workplaces", href: "/network?tab=workplaces", query: head("organizations") },
    { label: "Active Jobs", href: "/admin/jobs", query: head("jobs").eq("status", "active") },
    { label: "Open Projects", href: "/admin/projects", query: head("projects").eq("status", "open") },
    { label: "Active Services", href: "/admin/gigs", query: head("gigs").eq("status", "active") },
    { label: "Published GigThoughts", href: "/home", query: head("posts").eq("content_format", "standard").eq("status", "published") },
    { label: "Open Reports", href: "/admin/moderation", query: head("content_reports").eq("status", "open") },
    { label: "Pending Verification", href: "/admin/verifications", query: head("profiles").eq("verification_status", "pending") },
    { label: "Banned Profiles", href: "/admin/users", query: head("profiles").eq("is_banned", true) },
  ]
  const results = await Promise.all(stats.map(async stat => {
    try { const result = await stat.query; return { ...stat, count: result.error || result.count === null ? null : result.count } }
    catch { return { ...stat, count: null } }
  }))
  return <section className="mx-auto max-w-6xl space-y-6 px-4 py-8"><header><h1 className="text-2xl font-bold text-white">GigWay launch dashboard</h1><p className="mt-2 text-sm text-slate-400">Counts from stored records. Unavailable data is shown explicitly.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map(stat => <Link prefetch={false} key={stat.label} href={stat.href} className="min-w-0 rounded-xl border border-slate-700 p-4"><h2 className="break-words text-sm font-semibold text-slate-300">{stat.label}</h2><p className="mt-3 text-2xl font-bold text-white">{stat.count === null ? "Unavailable" : stat.count.toLocaleString("en-IN")}</p></Link>)}</div><section className="rounded-xl border border-slate-700 p-4"><h2 className="font-bold text-white">Payments and launch checks</h2><p className="mt-2 text-sm leading-6 text-slate-400">Revenue uses successful payment records, never plan or Pro flags. Active-user activity is not measured by profile counts. Escrow payments are paused; team lifecycle and global Block enforcement still require review.</p><div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-indigo-300"><Link prefetch={false} href="/admin/revenue">Payment records</Link><Link prefetch={false} href="/admin/moderation">Review reports</Link><Link prefetch={false} href="/admin/verifications">Verification review</Link></div></section></section>
}
