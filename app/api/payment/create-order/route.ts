import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@/lib/supabase/server"
import { getProduct } from "@/lib/billing/catalog"
export async function POST(req: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Existing payment/verification records reference profiles(id). Refuse to
  // create a charge until this authenticated account has that compatible row.
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "Your professional profile is not ready for payments yet." }, { status: 409 })
  const { product_key } = await req.json().catch(() => ({})); const product = getProduct(product_key)
  if (!product) return NextResponse.json({ error: "This purchase option is being updated." }, { status: 409 })
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID; const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) return NextResponse.json({ error: "Payment gateway not configured." }, { status: 500 })
  const order = await new Razorpay({ key_id, key_secret }).orders.create({ amount: product.amountPaise, currency: "INR", receipt: `gw_${user.id.slice(0,8)}_${Date.now()}`, notes: { user_id: user.id, product_key: product.key, product_version: "prepaid_v1" } })
  const { error } = await supabase.from("payment_orders").insert({ razorpay_order_id: order.id, user_id: user.id, product_key: product.key, amount_paise: product.amountPaise, currency: "INR" })
  if (error) return NextResponse.json({ error: "Could not record payment order." }, { status: 500 })
  return NextResponse.json({ order_id: order.id, amount: product.amountPaise, currency: "INR", product_label: product.label })
}
