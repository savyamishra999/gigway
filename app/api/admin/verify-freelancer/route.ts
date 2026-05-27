import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",")
  .map(e => e.trim().toLowerCase())

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Admin check
  const email = user.email?.toLowerCase() || ""
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { userId?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { userId, action } = body
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 })
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 })
  }

  if (action === "approve") {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: true, verification_status: "verified" })
      .eq("id", userId)

    if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 })

    // Insert notification for the user
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "verification",
      message: "Your GigWay profile has been verified! ✅",
      body: "Congratulations! Your Verified Badge is now live on your profile.",
      link: "/profile",
    }).then(() => null, () => null)

    return NextResponse.json({ success: true, action: "approved" })
  }

  // Reject
  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: "rejected", is_verified: false })
    .eq("id", userId)

  if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 })

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "verification",
    message: "Verification not approved",
    body: "Your verification document could not be verified. Please contact support@gigway.in",
    link: "/dashboard",
  }).then(() => null, () => null)

  return NextResponse.json({ success: true, action: "rejected" })
}
