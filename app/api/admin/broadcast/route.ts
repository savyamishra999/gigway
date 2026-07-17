import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Target = "all" | "freelancers" | "clients" | "boosted"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { title, message, target } = (await req.json()) as {
    title: string; message: string; target: Target
  }

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "title and message required" }, { status: 400 })
  }

  let query = adminDb.from("profiles").select("id")
  if (target === "boosted") {
    query = query.eq("is_boosted", true).gt("boost_expires_at", new Date().toISOString())
  }

  const { data: users, error: usersErr } = await query
  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })
  if (!users || users.length === 0) {
    return NextResponse.json({ success: true, sentTo: 0 })
  }

  const BATCH = 500
  const rows = users.map(u => ({
    user_id:  u.id,
    type:     "broadcast",
    title:    `📢 GigWay: ${title}`,
    body:     message,
    is_read:  false,
    link:     null,
  }))

  let sentTo = 0
  let firstError: string | null = null

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error, data } = await adminDb
      .from("notifications")
      .insert(rows.slice(i, i + BATCH))
      .select("id")

    if (error) {
      firstError = error.message
      console.error("Broadcast insert error:", error.message, error)
      break
    }
    sentTo += data?.length ?? rows.slice(i, i + BATCH).length
  }

  if (firstError) {
    return NextResponse.json({ error: `Insert failed: ${firstError}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, sentTo })
}
