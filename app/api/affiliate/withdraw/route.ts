import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { upi_id?: string; amount?: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { upi_id, amount } = body
  if (!upi_id?.trim() || !amount || amount < 500) {
    return NextResponse.json({ error: "UPI ID required and minimum payout is ₹500" }, { status: 400 })
  }

  // Fetch approved affiliate
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, total_earnings")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle()

  if (!affiliate) return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 })

  // Calculate available (total earned minus already paid)
  const { data: paidPayouts } = await supabase
    .from("affiliate_payouts")
    .select("amount")
    .eq("affiliate_id", affiliate.id)
    .eq("status", "paid")

  const paidOut = (paidPayouts ?? []).reduce((s, p) => s + p.amount, 0)
  const available = Math.max(0, (affiliate.total_earnings ?? 0) - paidOut)

  if (amount > available) {
    return NextResponse.json({ error: `Only ₹${available} available` }, { status: 400 })
  }

  const { error } = await supabase.from("affiliate_payouts").insert({
    affiliate_id: affiliate.id,
    amount,
    upi_id: upi_id.trim(),
    status: "pending",
  })

  if (error) {
    console.error("[affiliate/withdraw]", error.message)
    return NextResponse.json({ error: "Failed to request withdrawal" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
