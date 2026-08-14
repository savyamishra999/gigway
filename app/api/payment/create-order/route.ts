import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient as createServiceClient } from "@supabase/supabase-js"
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return NextResponse.json({ error: "Payment order storage is not configured." }, { status: 503 })
  const order = await new Razorpay({ key_id, key_secret }).orders.create({ amount: product.amountPaise, currency: "INR", receipt: `gw_${user.id.slice(0,8)}_${Date.now()}`, notes: { user_id: user.id, product_key: product.key, product_version: "prepaid_v1" } })
  // The session client above establishes identity. This privileged client is
  // deliberately used only for the server-created payment order record.
  const billing = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
  const { error } = await billing.from("payment_orders").insert({ razorpay_order_id: order.id, user_id: user.id, product_key: product.key, amount_paise: product.amountPaise, currency: "INR", status: "created" })
  if (error) {
    console.error("[payment:create-order] payment_orders insert failed", { code: error.code, message: error.message, details: error.details, hint: error.hint, orderId: order.id, userId: user.id, productKey: product.key })
    return NextResponse.json({ error: "Could not record payment order." }, { status: 500 })
  }
  return NextResponse.json({ order_id: order.id, amount: product.amountPaise, currency: "INR", product_label: product.label })
}
