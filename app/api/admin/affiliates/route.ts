import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { action?: string; affiliate_id?: string; payout_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { action, affiliate_id, payout_id } = body

  if (action === "approve" && affiliate_id) {
    const { error } = await supabase
      .from("affiliates")
      .update({ status: "approved" })
      .eq("id", affiliate_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "reject" && affiliate_id) {
    const { error } = await supabase
      .from("affiliates")
      .update({ status: "rejected" })
      .eq("id", affiliate_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "mark_paid" && payout_id) {
    const { error } = await supabase
      .from("affiliate_payouts")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payout_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
