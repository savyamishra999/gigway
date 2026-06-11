import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

// Use service-role client — webhook has no user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CONNECTS_MAP: Record<string, number> = {
  connects_20: 20, connects_60: 60, connects_150: 150,
  connects_10: 10, connects_25: 25, connects_50: 50,
  flash_5: 5,
}

const BOOST_PLANS = new Set(["boost_basic", "boost_standard", "boost_premium"])

export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await req.text()
  const signature = req.headers.get("x-razorpay-signature") ?? ""
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ""

  if (!secret) {
    // Webhook secret not configured — skip signature check in dev
    console.warn("RAZORPAY_WEBHOOK_SECRET not set")
  } else {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")

    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 })
  }

  const event = payload.event as string

  if (event === "payment.captured") {
    const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown>
    const entity = paymentEntity?.entity as Record<string, unknown>

    if (!entity) return NextResponse.json({ ok: true })

    const paymentId = entity.id as string
    const orderId   = entity.order_id as string
    const notes     = (entity.notes as Record<string, string>) ?? {}
    const planType  = notes.plan_type
    const userId    = notes.user_id

    if (!planType || !userId) {
      // No metadata attached — nothing to provision
      return NextResponse.json({ ok: true })
    }

    // Idempotency: check if we already processed this payment
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle()

    if (existing) return NextResponse.json({ ok: true })

    // Provision the plan
    if (BOOST_PLANS.has(planType)) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from("profiles").update({
        is_boosted: true,
        boost_expires_at: expiresAt,
        boost_plan: planType,
      }).eq("id", userId)

    } else if (planType === "verified_badge") {
      await supabase.from("profiles")
        .update({ verification_paid_at: new Date().toISOString() })
        .eq("id", userId)

    } else if (CONNECTS_MAP[planType]) {
      const { data: profile } = await supabase
        .from("profiles").select("connects_balance").eq("id", userId).single()
      const current = profile?.connects_balance ?? 0
      await supabase.from("profiles")
        .update({ connects_balance: current + CONNECTS_MAP[planType] })
        .eq("id", userId)

      await supabase.from("connects_transactions").insert({
        user_id: userId,
        amount: CONNECTS_MAP[planType],
        type: "credit",
        description: `Purchased ${CONNECTS_MAP[planType]} connects (webhook)`,
        payment_id: paymentId,
      })
    }

    // Record in subscriptions for the live feed
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan: planType,
      payment_id: paymentId,
      order_id: orderId,
      status: "active",
    })
  }

  if (event === "payment.failed") {
    // Log failed payments — non-critical
    const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown>
    const entity = paymentEntity?.entity as Record<string, unknown>
    const notes  = (entity?.notes as Record<string, string>) ?? {}

    await supabase.from("subscriptions").insert({
      user_id: notes.user_id ?? null,
      plan: notes.plan_type ?? "unknown",
      payment_id: (entity?.id as string) ?? null,
      order_id: (entity?.order_id as string) ?? null,
      status: "failed",
    }).then(() => null, () => null)
  }

  return NextResponse.json({ ok: true })
}
