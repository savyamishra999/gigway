import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { userId, grantType, note } = body || {}
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json({ error: "Valid userId required" }, { status: 400 })
  }
  // Do not restore non-idempotent balance writes while financial flows are paused.
  if (grantType === "connects_20" || grantType === "connects_60") {
    return NextResponse.json({ error: "Connects grants are paused pending atomic crediting review." }, { status: 503 })
  }
  const boostDays: Record<string, number> = { boost_1m: 30, boost_3m: 90, boost_6m: 180 }
  let updates: Record<string, unknown>
  if (grantType === "verified_badge") updates = { is_verified: true, verification_status: "verified" }
  else if (grantType === "remove_ban") updates = { is_banned: false }
  else if (typeof grantType === "string" && Object.hasOwn(boostDays, grantType)) {
    updates = { is_boosted: true, boost_expires_at: new Date(Date.now() + boostDays[grantType] * 86400000).toISOString(), boost_plan: grantType }
  } else return NextResponse.json({ error: "Unsupported grant type" }, { status: 400 })

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return NextResponse.json({ error: "Admin grants are unavailable." }, { status: 503 })
  // Construct the privileged client only after verified admin authorization.
  const adminDb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
  const { data: profile, error: updateError } = await adminDb.from("profiles")
    .update(updates).eq("id", userId).select("id").maybeSingle()
  if (updateError) return NextResponse.json({ error: "Grant could not be applied." }, { status: 503 })
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 })

  const { data: grant, error } = await adminDb.from("admin_grants").insert({
    user_id: userId,
    admin_id: user.id,
    grant_type: grantType,
    note: typeof note === "string" ? note.slice(0, 2000) : null,
    granted_at: new Date().toISOString(),
  }).select("id").single()
  if (error) {
    // The profile change already succeeded; do not encourage a duplicate retry.
    console.error("[special-grant] audit log failed:", error.code)
    return NextResponse.json({ success: true, id: null, warning: "Grant applied, but its audit entry could not be saved. Do not repeat the grant." })
  }
  return NextResponse.json({ success: true, id: grant.id })
}
