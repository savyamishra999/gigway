import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Delete all FK-dependent data in parallel
    await Promise.allSettled([
      // Content
      adminClient.from("gigs").delete().eq("freelancer_id", userId),
      adminClient.from("jobs").delete().eq("poster_id", userId),
      adminClient.from("projects").delete().eq("client_id", userId),
      adminClient.from("proposals").delete().eq("freelancer_id", userId),
      adminClient.from("job_applications").delete().eq("applicant_id", userId),
      adminClient.from("portfolio_items").delete().eq("freelancer_id", userId),
      // Reviews (both as reviewer and reviewee)
      adminClient.from("reviews").delete().eq("reviewer_id", userId),
      adminClient.from("reviews").delete().eq("reviewee_id", userId),
      // Social / saved
      adminClient.from("saved_items").delete().eq("user_id", userId),
      // Comms
      adminClient.from("messages").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      adminClient.from("notifications").delete().eq("user_id", userId),
      adminClient.from("support_tickets").delete().eq("user_id", userId),
      // Finance
      adminClient.from("payments").delete().eq("user_id", userId),
      adminClient.from("connects_transactions").delete().eq("user_id", userId),
      adminClient.from("subscriptions").delete().eq("user_id", userId),
      // Affiliate
      adminClient.from("affiliates").delete().eq("user_id", userId),
      adminClient.from("affiliate_clicks").delete().eq("user_id", userId),
      adminClient.from("affiliate_conversions").delete().eq("user_id", userId),
    ])

    // 2. Delete profile
    await adminClient.from("profiles").delete().eq("id", userId)

    // 3. Delete auth user
    const { error: authErr } = await adminClient.auth.admin.deleteUser(userId)
    if (authErr) {
      console.error("[delete-user] auth.deleteUser error:", authErr.message)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[delete-user]", msg)
    return NextResponse.json({ error: "Delete failed: " + msg }, { status: 500 })
  }
}
