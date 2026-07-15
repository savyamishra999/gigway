import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@/lib/supabase/server"

const PLANS: Record<string, number> = {
  // Subscriptions
  find_work_monthly:      4900,   // ₹49
  hire_talent_monthly:   19900,   // ₹199
  // Verification
  verification_yearly:   19900,   // ₹199
  // Boost
  boost_basic:           9900,
  boost_standard:       19900,
  boost_premium:        29900,
  // Verified badge
  verified_badge:       29900,
  employer_verified:    49900,
  // Connects
  connects_20:           9900,
  connects_60:          24900,
  connects_150:         49900,
  // Legacy connect plans
  connects_10:           9900,
  connects_25:          19900,
  connects_50:          34900,
  // Power-ups
  resume_builder:        4900,
  priority_application:  1900,
  profile_review:        9900,
  job_alerts:            4900,
  featured_gig:          9900,
  quick_apply_pack:     14900,
  // Legacy
  pro:                  19900,
  business:             99900,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: { type?: string; metadata?: Record<string, unknown> }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { type, metadata } = body
    if (!type || !(type in PLANS)) {
      return NextResponse.json(
        { error: `Invalid plan "${type}". Valid: ${Object.keys(PLANS).join(", ")}` },
        { status: 400 }
      )
    }

    const keyId     = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
    const keySecret = process.env.RAZORPAY_KEY_SECRET || ""

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment gateway not configured. Contact support." },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const amount   = PLANS[type]

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `gw_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, plan_type: type, ...(metadata ?? {}) },
    })

    return NextResponse.json({
      order_id:  order.id,
      amount:    order.amount,
      currency:  order.currency,
      plan_type: type,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[create-order]", message)
    return NextResponse.json({ error: `Payment order failed: ${message}` }, { status: 500 })
  }
}
