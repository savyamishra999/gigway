import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@/lib/supabase/server"

const PRICES: Record<string, number> = {
  pro: 19900,
  business: 99900,
  connects_10: 9900,
  connects_25: 19900,
  connects_50: 34900,
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse body
    let body: { type?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { type } = body

    if (!type || !PRICES[type]) {
      return NextResponse.json(
        { error: `Invalid plan type: "${type}". Valid types: ${Object.keys(PRICES).join(", ")}` },
        { status: 400 }
      )
    }

    // Validate env vars — .env.local uses NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    console.log("[create-order] KEY_ID present:", !!keyId, "| KEY_SECRET present:", !!keySecret)

    if (!keyId || !keySecret) {
      console.error("[create-order] Missing Razorpay env vars")
      return NextResponse.json(
        { error: "Payment gateway not configured. Contact support." },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const amount = PRICES[type]

    console.log("[create-order] Creating order — type:", type, "| amount:", amount, "| user:", user.id)

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `gw_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_type: type,
      },
    })

    console.log("[create-order] Order created:", order.id)

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan_type: type,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[create-order] Error:", message)
    return NextResponse.json({ error: `Failed to create payment order: ${message}` }, { status: 500 })
  }
}
