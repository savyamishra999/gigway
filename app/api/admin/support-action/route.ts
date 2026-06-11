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

  const body = await req.json()
  const { ticketId, status, reply } = body

  if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 })

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Handle admin reply
  if (reply) {
    const { data: ticket, error: fetchErr } = await adminClient
      .from("support_tickets")
      .select("user_id, subject")
      .eq("id", ticketId)
      .single()

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

    const { error } = await adminClient
      .from("support_tickets")
      .update({ admin_reply: reply, replied_at: new Date().toISOString(), status: "resolved" })
      .eq("id", ticketId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify user if they have an account
    if (ticket?.user_id) {
      await adminClient.from("notifications").insert({
        user_id:  ticket.user_id,
        type:     "support_reply",
        title:    "Reply from GigWay ✅",
        body:     reply.slice(0, 200),
        is_read:  false,
      }).then(() => null, () => null)
    }

    return NextResponse.json({ success: true })
  }

  // Handle status update
  if (!status) return NextResponse.json({ error: "status or reply required" }, { status: 400 })
  const allowed = ["open", "in_progress", "resolved"]
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  const { error } = await adminClient
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
