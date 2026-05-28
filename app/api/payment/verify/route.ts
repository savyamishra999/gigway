import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const PLAN_AMOUNTS_RUPEES: Record<string, number> = {
  boost_basic: 99, boost_standard: 199, boost_premium: 299,
  verified_badge: 299, pro: 199, business: 999,
  connects_10: 99, connects_25: 199, connects_50: 349,
}

const CONNECTS_MAP: Record<string, number> = {
  connects_10: 10,
  connects_25: 25,
  connects_50: 50,
}

const BOOST_PLANS = new Set(["boost_basic", "boost_standard", "boost_premium"])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    plan_type,
  } = await req.json()

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  // Update database based on plan type
  if (BOOST_PLANS.has(plan_type)) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from("profiles")
      .update({
        is_boosted: true,
        boost_expires_at: expiresAt,
        boost_plan: plan_type,
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to activate boost" }, { status: 500 })
    }

    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: plan_type,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: "active",
    }).then(() => null, () => null)

  } else if (plan_type === "verified_badge") {
    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 })
    }

    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: plan_type,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: "active",
    }).then(() => null, () => null)

  } else if (plan_type === "pro" || plan_type === "business") {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: plan_type })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    // Record subscription (non-fatal)
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: plan_type,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: "active",
    }).then(() => null, () => null)
  } else if (CONNECTS_MAP[plan_type]) {
    const connectsToAdd = CONNECTS_MAP[plan_type]

    // Increment connects balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("connects_balance")
      .eq("id", user.id)
      .single()

    const currentBalance = profile?.connects_balance ?? 0
    const { error } = await supabase
      .from("profiles")
      .update({ connects_balance: currentBalance + connectsToAdd })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to update connects" }, { status: 500 })
    }

    // Record transaction (non-fatal)
    await supabase.from("connects_transactions").insert({
      user_id: user.id,
      amount: connectsToAdd,
      type: "credit",
      description: `Purchased ${connectsToAdd} connects`,
      payment_id: razorpay_payment_id,
    }).then(() => null, () => null)
  }

  // ── Affiliate commission (non-blocking) ─────────────────────────────────
  try {
    const cookieStore = await cookies()
    const refCode = cookieStore.get("gigway_ref")?.value
    if (refCode) {
      const saleAmount = PLAN_AMOUNTS_RUPEES[plan_type] ?? 0
      if (saleAmount > 0) {
        const commission = Math.floor(saleAmount * 0.2)

        await supabase.from("affiliate_conversions").insert({
          ref_code: refCode,
          payment_id: razorpay_payment_id,
          sale_amount: saleAmount,
          commission,
        })

        // Increment total_earnings on the affiliate row
        const { data: aff } = await supabase
          .from("affiliates")
          .select("id, total_earnings")
          .eq("ref_code", refCode)
          .eq("status", "approved")
          .maybeSingle()

        if (aff) {
          await supabase
            .from("affiliates")
            .update({ total_earnings: (aff.total_earnings ?? 0) + commission })
            .eq("id", aff.id)
        }
      }
    }
  } catch {
    // Commission errors must never block the payment response
  }

  return NextResponse.json({ success: true })
}
