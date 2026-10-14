import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { activityCursor, parseActivityCursor, uuid } from "@/lib/communication"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const raw = new URL(request.url).searchParams.get("cursor")
  const cursor = raw ? parseActivityCursor(raw) : null
  if (raw && !cursor) return NextResponse.json({ error: "Invalid cursor." }, { status: 400 })
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(31)
  if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
  const { data: notifications, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (notifications || []).slice(0, 30)
  return NextResponse.json({ notifications: rows, nextCursor: (notifications || []).length > 30 ? activityCursor(rows[rows.length - 1]) : null }, { headers: { "Cache-Control": "no-store" } })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || (body.all !== true && !uuid(body.id))) return NextResponse.json({ error: "Invalid notification request." }, { status: 400 })
  const { id, all } = body

  if (all === true) {
    // Mark all as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "All notifications marked as read" })
  }

  if (!id) {
    return NextResponse.json({ error: "Missing notification id or 'all' flag" }, { status: 400 })
  }

  // Mark single notification as read (ensure it belongs to the user)
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
