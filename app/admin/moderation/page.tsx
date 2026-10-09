import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { adminViewer } from "@/lib/admin/access"
import { boundedFetch } from "@/lib/async"
import ModerationReviewActions from "@/components/admin/ModerationReviewActions"

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await adminViewer())) redirect("/")
  const value = Number((await searchParams).page || 1), page = Number.isSafeInteger(value) && value > 0 && value <= Math.floor(Number.MAX_SAFE_INTEGER / 25) ? value : 1
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: boundedFetch } })
  const result = await db.from("content_reports").select("id,post_id,comment_id,reason,details,status,created_at").eq("status", "open")
    .order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 25, page * 25)
  if (result.error) throw new Error("Moderation reports could not be loaded.")
  const rows = (result.data || []).slice(0, 25), more = (result.data || []).length > 25
  return <section className="mx-auto max-w-4xl space-y-5 px-4 py-8"><h1 className="text-2xl font-bold text-white">Moderation reports</h1><p className="text-sm text-slate-400">Open reports for administrator review. Reporting does not automatically establish a violation.</p>{rows.map(report => <article key={report.id} className="min-w-0 rounded-xl border border-slate-700 p-4"><h2 className="break-words font-bold text-white">{report.reason}</h2>{report.details && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">{report.details}</p>}<p className="mt-2 text-xs text-slate-400">Status: {report.status} · Received {report.created_at}</p>{report.post_id && <Link prefetch={false} href={`/social/posts/${report.post_id}`} className="mt-3 inline-block text-sm text-indigo-300">View reported post</Link>}{report.comment_id && <p className="mt-2 break-all text-xs text-slate-400">Comment reference: {report.comment_id}</p>}<ModerationReviewActions id={report.id} /></article>)}{!rows.length && <p className="text-sm text-slate-400">No open reports on this page.</p>}<nav aria-label="Moderation pages" className="flex gap-4 text-sm font-bold text-indigo-300">{page > 1 && <Link href={`?page=${page - 1}`}>Previous</Link>}{more && <Link href={`?page=${page + 1}`}>Next</Link>}</nav></section>
}
