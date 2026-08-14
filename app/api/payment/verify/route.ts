import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import Razorpay from "razorpay"
import { createClient } from "@/lib/supabase/server"
import { createClient as serviceClient } from "@supabase/supabase-js"
import { getProduct } from "@/lib/billing/catalog"
import { provisionProduct } from "@/lib/billing/entitlements"
export async function POST(req: NextRequest) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json().catch(() => ({}))
  if (![razorpay_payment_id, razorpay_order_id, razorpay_signature].every(Boolean)) return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
  const secret = process.env.RAZORPAY_KEY_SECRET; const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
  if (!secret || !keyId) return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return NextResponse.json({ error: "Payment verification storage is not configured" }, { status: 503 })
  const signature = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(razorpay_signature))) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  const admin = serviceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
  const { data: pending } = await admin.from("payment_orders").select("user_id,product_key,amount_paise,currency,status,razorpay_payment_id").eq("razorpay_order_id", razorpay_order_id).maybeSingle()
  if (!pending || pending.user_id !== user.id) return NextResponse.json({ error: "Payment order not found" }, { status: 404 })
  if (pending.razorpay_payment_id && pending.razorpay_payment_id !== razorpay_payment_id) return NextResponse.json({ error: "Order already linked to another payment" }, { status: 409 })
  const product = getProduct(pending.product_key); if (!product || product.amountPaise !== pending.amount_paise || pending.currency !== "INR") return NextResponse.json({ error: "Invalid order product" }, { status: 400 })
  const razorpay = new Razorpay({ key_id: keyId, key_secret: secret }); const [order, payment] = await Promise.all([razorpay.orders.fetch(razorpay_order_id), razorpay.payments.fetch(razorpay_payment_id)])
  if (order.amount !== product.amountPaise || order.currency !== "INR" || payment.order_id !== razorpay_order_id || payment.amount !== product.amountPaise || payment.currency !== "INR" || payment.status !== "captured") return NextResponse.json({ error: "Payment could not be validated" }, { status: 400 })
  const result = await provisionProduct(admin, { userId: user.id, product, paymentId: razorpay_payment_id, orderId: razorpay_order_id })
  return NextResponse.json({ success: true, provisioned: !result.already })
}
