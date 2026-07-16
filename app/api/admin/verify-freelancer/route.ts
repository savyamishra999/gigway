import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { userId?: string; action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { userId, action, reason } = body
  if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 })
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 })
  }

  if (action === "approve") {
    // adminDb bypasses RLS — can update any user's profile
    const { error } = await adminDb
      .from("profiles")
      .update({ is_verified: true, verification_status: "approved" })
      .eq("id", userId)

    if (error) return NextResponse.json({ error: "DB update failed: " + error.message }, { status: 500 })

    await adminDb.from("notifications").insert({
      user_id: userId,
      type:    "verification",
      title:   "Profile Verified! ✅",
      message: "Your GigWay profile has been verified!",
      body:    "Congratulations! Your Verified Badge is now live on your profile.",
      link:    "/profile",
      is_read: false,
    }).then(() => null, () => null)

    return NextResponse.json({ success: true, action: "approved" })
  }

  // Reject — docs are kept, only status changes
  const { error } = await adminDb
    .from("profiles")
    .update({ verification_status: "rejected", is_verified: false })
    .eq("id", userId)

  if (error) return NextResponse.json({ error: "DB update failed: " + error.message }, { status: 500 })

  await adminDb.from("notifications").insert({
    user_id: userId,
    type:    "verification",
    title:   "Verification Not Approved",
    message: "Verification not approved",
    body:    reason
      ? `Reason: ${reason}. Please resubmit at gigway.in/verify`
      : "Your verification document could not be verified. Please contact business@vjenix.com",
    link:    "/verify",
    is_read: false,
  }).then(() => null, () => null)

  return NextResponse.json({ success: true, action: "rejected" })
}
