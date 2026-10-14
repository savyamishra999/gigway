import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
export async function GET() {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [messages, notifications, latest] = await Promise.all([
      db.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
      db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      db.from("messages").select("id,sender_id,created_at").eq("receiver_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
    ])
    if (messages.error || notifications.error || latest.error) throw Error()
    const ids = [...new Set((latest.data || []).map(m => m.sender_id))]
    const profiles = ids.length ? await db.from("profiles").select("id,full_name").in("id", ids) : { data: [], error: null }
    if (profiles.error) throw profiles.error
    const names = new Map((profiles.data || []).map(p => [p.id, p.full_name]))
    return NextResponse.json({ messages: messages.count || 0, notifications: notifications.count || 0, recentMessages: (latest.data || []).map(m => ({ ...m, sender_name: names.get(m.sender_id) || "GigWay member" })) }, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "Activity unavailable." }, { status: 503 }) }
}
