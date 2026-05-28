import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

const PLAN_AMOUNTS: Record<string, number> = {
  boost_basic: 99, boost_standard: 199, boost_premium: 299,
  verified_badge: 299, pro: 199, business: 999,
  connects_10: 99, connects_25: 199, connects_50: 349,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("plan, payment_id, order_id, created_at, profiles:user_id(full_name, email)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5000)

  const rows = (subs ?? []) as unknown as Array<{
    plan: string; payment_id: string; order_id: string; created_at: string
    profiles: { full_name: string | null; email: string } | null
  }>

  const header = "Name,Email,Plan,Amount (INR),Date,Order ID,Payment ID\n"
  const csv = rows.map(r => {
    const name = (r.profiles?.full_name ?? "").replace(/,/g, " ")
    const email = r.profiles?.email ?? ""
    const plan = r.plan
    const amount = PLAN_AMOUNTS[plan] ?? 0
    const date = new Date(r.created_at).toLocaleDateString("en-IN")
    return `"${name}","${email}","${plan}",${amount},"${date}","${r.order_id}","${r.payment_id}"`
  }).join("\n")

  return new NextResponse(header + csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gigway-revenue-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
