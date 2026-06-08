import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId, grantType, note } = await req.json()
  if (!userId || !grantType) return NextResponse.json({ error: "userId and grantType required" }, { status: 400 })

  // Apply the grant
  if (grantType === "verified_badge") {
    await supabase.from("profiles")
      .update({ is_verified: true, verification_status: "verified" })
      .eq("id", userId)
  } else if (grantType === "boost_1m") {
    const exp = new Date(Date.now() + 30 * 86400000).toISOString()
    await supabase.from("profiles")
      .update({ is_boosted: true, boost_expires_at: exp, boost_plan: "boost_1m" })
      .eq("id", userId)
  } else if (grantType === "boost_3m") {
    const exp = new Date(Date.now() + 90 * 86400000).toISOString()
    await supabase.from("profiles")
      .update({ is_boosted: true, boost_expires_at: exp, boost_plan: "boost_3m" })
      .eq("id", userId)
  } else if (grantType === "boost_6m") {
    const exp = new Date(Date.now() + 180 * 86400000).toISOString()
    await supabase.from("profiles")
      .update({ is_boosted: true, boost_expires_at: exp, boost_plan: "boost_6m" })
      .eq("id", userId)
  } else if (grantType === "remove_ban") {
    await supabase.from("profiles").update({ is_banned: false }).eq("id", userId)
  } else if (grantType === "connects_20") {
    await supabase.rpc("increment_connects", { uid: userId, amount: 20 })
  } else if (grantType === "connects_60") {
    await supabase.rpc("increment_connects", { uid: userId, amount: 60 })
  }

  // Log in admin_grants
  const { data: grant, error } = await supabase.from("admin_grants").insert({
    user_id: userId,
    admin_id: user.id,
    grant_type: grantType,
    note: note || null,
    granted_at: new Date().toISOString(),
  }).select("id").single()

  if (error) {
    console.error("[special-grant] log error:", error.message)
    return NextResponse.json({ success: true, id: null })
  }

  return NextResponse.json({ success: true, id: grant.id })
}
