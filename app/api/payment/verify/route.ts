import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"

const CONNECTS_MAP: Record<string, number> = {
  connects_10: 10,
  connects_25: 25,
  connects_50: 50,
}

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
  if (plan_type === "pro" || plan_type === "business") {
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

  return NextResponse.json({ success: true })
}
