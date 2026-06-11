import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { subject, message, name, email } = await req.json()
  if (!subject || !message?.trim()) {
    return NextResponse.json({ error: "subject and message required" }, { status: 400 })
  }

  const senderName  = name  || user?.email?.split("@")[0] || "Anonymous"
  const senderEmail = email || user?.email || "unknown"

  const { error } = await adminDb.from("support_tickets").insert({
    name:    senderName,
    email:   senderEmail,
    subject,
    message,
    status:  "open",
    user_id: user?.id ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the user that we received their ticket
  if (user?.id) {
    await adminDb.from("notifications").insert({
      user_id:  user.id,
      type:     "support_received",
      title:    "GigWay ✅ received your message",
      body:     `We got your "${subject}" ticket. We'll reply within 24 hours.`,
      is_read:  false,
    }).then(() => null, () => null)
  }

  return NextResponse.json({ success: true })
}
