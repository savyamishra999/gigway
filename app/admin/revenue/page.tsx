import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { adminViewer } from "@/lib/admin/access"
import { boundedFetch } from "@/lib/async"
import ContentTimestamp from "@/components/ui/ContentTimestamp"

export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<{ page?: string; period?: string }> }) {
  if (!(await adminViewer())) redirect("/")
  const params = await searchParams, value = Number(params.page || 1)
  const page = Number.isSafeInteger(value) && value > 0 && value <= Math.floor(Number.MAX_SAFE_INTEGER / 50) ? value : 1
  const period = params.period === "week" || params.period === "month" ? params.period : "all"
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: boundedFetch } })
  let query = db.from("payments").select("id,plan,amount,created_at").in("status", ["success", "captured", "paid"])
  if (period !== "all") query = query.gte("created_at", new Date(Date.now() - (period === "week" ? 7 : 30) * 86400000).toISOString())
  const result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 50, page * 50)
  if (result.error) throw new Error("Payment records could not be loaded.")
  const rows = (result.data || []).slice(0, 50), more = (result.data || []).length > 50
  const validAmount = (value: unknown) => value !== null && value !== "" && (typeof value === "number" || typeof value === "string") && Number.isFinite(Number(value)) && Number(value) >= 0
  const subtotal = rows.reduce((sum, row) => sum + (validAmount(row.amount) ? Number(row.amount) : 0), 0)
  return <section className="mx-auto max-w-4xl space-y-5 px-4 py-8"><h1 className="text-2xl font-bold text-white">Successful payment records</h1><p className="text-sm text-slate-400">Recorded INR amounts on this page. This is not net revenue, a payout balance or an all-time total. Failed-payment reconciliation and refund status are unavailable in this view. Refund reconciliation is not included.</p><nav aria-label="Payment period" className="flex flex-wrap gap-4 text-sm font-bold text-indigo-300">{[["all", "All records"], ["week", "Last 7 days"], ["month", "Last 30 days"]].map(([key,label]) => <Link prefetch={false} key={key} href={`?period=${key}`} aria-current={period === key ? "page" : undefined}>{label}</Link>)}</nav><p className="font-bold text-white">Page subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>{rows.some(row => !validAmount(row.amount)) && <p role="alert" className="text-sm text-amber-300">Some recorded amounts are invalid and excluded from the subtotal.</p>}<ul className="space-y-3">{rows.map(row => <li key={row.id} className="min-w-0 rounded-xl border border-slate-700 p-4"><p className="break-words font-bold text-white">{row.plan || "Recorded payment"}</p><p className="mt-2 text-sm text-slate-300">{validAmount(row.amount) ? `₹${Number(row.amount).toLocaleString("en-IN")}` : "Amount unavailable"}</p><ContentTimestamp createdAt={row.created_at} exact className="mt-2 block text-xs text-slate-400" /></li>)}</ul>{!rows.length && <p className="text-sm text-slate-400">No successful payment records on this page.</p>}<nav aria-label="Payment pages" className="flex flex-wrap gap-4 text-sm font-bold text-indigo-300">{page > 1 && <Link prefetch={false} href={`?period=${period}&page=${page - 1}`}>Previous</Link>}{more && <Link prefetch={false} href={`?period=${period}&page=${page + 1}`}>Next</Link>}</nav></section>
}
