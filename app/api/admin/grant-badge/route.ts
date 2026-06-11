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

  const { userId, revoke } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const update = revoke
    ? { is_verified: false, verification_status: "revoked" }
    : { is_verified: true, verification_status: "approved", verified_at: new Date().toISOString() }

  const { error } = await adminDb.from("profiles").update(update).eq("id", userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the user
  if (!revoke) {
    await adminDb.from("notifications").insert({
      user_id: userId,
      type: "verification_approved",
      title: "You're now Verified! ✅",
      body: "Your profile has been verified by GigWay. You now have the blue badge.",
      is_read: false,
    }).then(() => null, () => null)
  }

  return NextResponse.json({ success: true })
}
