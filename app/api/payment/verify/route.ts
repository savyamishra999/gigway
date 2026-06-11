import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Amount in rupees for affiliate commission
const PLAN_AMOUNTS_RUPEES: Record<string, number> = {
  boost_basic:          99,  boost_standard:     199,  boost_premium:     299,
  verified_badge:       299, employer_verified:  499,
  connects_20:          99,  connects_60:        249,  connects_150:      499,
  connects_10:          99,  connects_25:        199,  connects_50:       349,
  resume_builder:       49,  priority_application: 19, profile_review:    99,
  job_alerts:           49,  featured_gig:        99,  quick_apply_pack:  149,
  pro:                  199, business:            999,
}

const CONNECTS_MAP: Record<string, number> = {
  connects_10: 10, connects_25: 25, connects_50: 50,
  connects_20: 20, connects_60: 60, connects_150: 150,
}

const BOOST_PLANS = new Set(["boost_basic", "boost_standard", "boost_premium"])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    plan_type,
    metadata,
  } = await req.json()

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Verify Razorpay signature
  const body = razorpay_order_id + "|" + razorpay_payment_id
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  const amount = PLAN_AMOUNTS_RUPEES[plan_type] ?? 0

  // ── 1. Save payment record (authoritative) ──────────────────────────────
  await adminDb.from("payments").insert({
    user_id:             user.id,
    razorpay_order_id,
    razorpay_payment_id,
    plan:                plan_type,
    amount,
    status:              "success",
    metadata:            metadata ?? {},
  }).then(() => null, (e) => console.error("[verify] payments insert error:", e))

  // ── 2. Plan-specific logic ────────────────────────────────────────────────

  // Boost plans
  if (BOOST_PLANS.has(plan_type)) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await adminDb
      .from("profiles")
      .update({ is_boosted: true, boost_expires_at: expiresAt, boost_plan: plan_type })
      .eq("id", user.id)
    if (error) return NextResponse.json({ error: "Failed to activate boost" }, { status: 500 })

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "boost_activated",
      title: "⭐ Profile Boosted!",
      body: `Your profile boost (${plan_type.replace("boost_", "").replace(/^\w/, (c: string) => c.toUpperCase())}) is now active for 30 days.`,
      is_read: false,
    }).then(() => null, () => null)
  }

  // Verified badge
  else if (plan_type === "verified_badge" || plan_type === "employer_verified") {
    const { error } = await adminDb
      .from("profiles")
      .update({ verification_paid_at: new Date().toISOString() })
      .eq("id", user.id)
    if (error) return NextResponse.json({ error: "Failed to record verification payment" }, { status: 500 })

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "verification_payment",
      title: "✅ Payment received!",
      body: "Upload your Aadhaar documents to complete verification.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Connects
  else if (CONNECTS_MAP[plan_type]) {
    const toAdd = CONNECTS_MAP[plan_type]
    const { data: profile } = await adminDb
      .from("profiles").select("connects_balance").eq("id", user.id).single()
    const current = profile?.connects_balance ?? 0
    const { error } = await adminDb
      .from("profiles").update({ connects_balance: current + toAdd }).eq("id", user.id)
    if (error) return NextResponse.json({ error: "Failed to update connects" }, { status: 500 })

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "connects_purchased",
      title: `🔗 ${toAdd} Connects Added!`,
      body: `Your balance: ${current + toAdd} connects. Each project application costs 2 connects.`,
      is_read: false,
    }).then(() => null, () => null)

    // Legacy connects_transactions log
    await adminDb.from("connects_transactions").insert({
      user_id: user.id, amount: toAdd, type: "credit",
      description: `Purchased ${toAdd} connects`, payment_id: razorpay_payment_id,
    }).then(() => null, () => null)
  }

  // Resume builder
  else if (plan_type === "resume_builder") {
    const { data: p } = await adminDb.from("profiles").select("purchased_features").eq("id", user.id).single()
    const existing = (p?.purchased_features as string[] | null) ?? []
    if (!existing.includes("resume_builder")) {
      await adminDb.from("profiles")
        .update({ purchased_features: [...existing, "resume_builder"] })
        .eq("id", user.id)
    }

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "resume_builder_purchased",
      title: "📄 Resume Builder Unlocked!",
      body: "Go to AI Tools → Resume Builder to generate your PDF resume.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Priority application
  else if (plan_type === "priority_application") {
    const { data: p } = await adminDb.from("profiles").select("priority_credits").eq("id", user.id).single()
    const current = p?.priority_credits ?? 0
    await adminDb.from("profiles").update({ priority_credits: current + 1 }).eq("id", user.id)

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "priority_application_purchased",
      title: "⚡ Priority Application Ready!",
      body: "You have 1 priority credit. Your next application will jump to the top of the list.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Profile review
  else if (plan_type === "profile_review") {
    await adminDb.from("support_tickets").insert({
      user_id: user.id,
      subject: "Profile Review Request",
      message: "User purchased Profile Review — please review their profile and provide feedback.",
      ticket_type: "profile_review",
      status: "open",
    }).then(() => null, () => null)

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "profile_review_requested",
      title: "🔍 Profile Review Requested!",
      body: "GigWay ✅ will review your profile within 24 hours and notify you.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Job alerts
  else if (plan_type === "job_alerts") {
    await adminDb.from("profiles").update({ job_alerts_active: true }).eq("id", user.id)

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "job_alerts_activated",
      title: "🔔 Job Alerts Activated!",
      body: "You'll receive instant notifications for new projects matching your skills.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Featured gig
  else if (plan_type === "featured_gig") {
    const gigId = metadata?.gig_id as string | undefined

    if (gigId) {
      const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await adminDb.from("gigs")
        .update({ is_featured: true, featured_until: featuredUntil })
        .eq("id", gigId).eq("freelancer_id", user.id)
        .then(() => null, () => null)
    }

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "featured_gig_purchased",
      title: "🌟 Featured Gig Activated!",
      body: gigId
        ? "Your gig is now featured at the top of the marketplace for 7 days."
        : "Your Featured Gig pack is ready. Contact GigWay Support to choose which gig to feature.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Quick apply pack
  else if (plan_type === "quick_apply_pack") {
    const { data: p } = await adminDb.from("profiles").select("quick_apply_credits").eq("id", user.id).single()
    const current = p?.quick_apply_credits ?? 0
    await adminDb.from("profiles").update({ quick_apply_credits: current + 30 }).eq("id", user.id)

    await adminDb.from("notifications").insert({
      user_id: user.id,
      type: "quick_apply_purchased",
      title: "🚀 30 Quick Apply Credits Added!",
      body: "Apply to projects in one click. Credits available in your dashboard.",
      is_read: false,
    }).then(() => null, () => null)
  }

  // Legacy subscription plans (pro / business)
  else if (plan_type === "pro" || plan_type === "business") {
    await adminDb.from("profiles").update({ subscription_tier: plan_type }).eq("id", user.id)
    await adminDb.from("subscriptions").insert({
      user_id: user.id, plan: plan_type,
      payment_id: razorpay_payment_id, order_id: razorpay_order_id, status: "active",
    }).then(() => null, () => null)
  }

  // ── 3. Also save legacy subscriptions record for boost/verified (admin revenue backward compat) ─
  if (BOOST_PLANS.has(plan_type) || plan_type === "verified_badge") {
    await adminDb.from("subscriptions").insert({
      user_id: user.id, plan: plan_type,
      payment_id: razorpay_payment_id, order_id: razorpay_order_id, status: "active",
    }).then(() => null, () => null)
  }

  // ── 4. Affiliate commission ────────────────────────────────────────────────
  try {
    const cookieStore = await cookies()
    const refCode = cookieStore.get("gigway_ref")?.value
    if (refCode && amount > 0) {
      const commission = Math.floor(amount * 0.2)
      await adminDb.from("affiliate_conversions").insert({
        ref_code: refCode, payment_id: razorpay_payment_id,
        sale_amount: amount, commission,
      })
      const { data: aff } = await adminDb
        .from("affiliates").select("id, total_earnings")
        .eq("ref_code", refCode).eq("status", "approved").maybeSingle()
      if (aff) {
        await adminDb.from("affiliates")
          .update({ total_earnings: (aff.total_earnings ?? 0) + commission })
          .eq("id", aff.id)
      }
    }
  } catch { /* affiliate errors must never block payment */ }

  return NextResponse.json({ success: true })
}
