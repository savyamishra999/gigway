import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { activityCursor, MESSAGE_LIMIT, parseActivityCursor, uuid } from "@/lib/communication"

const fields = "id,sender_id,receiver_id,content,created_at,is_read"
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })
export async function GET(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return reply({ error: "Sign in to view messages." }, 401)
    const params = new URL(request.url).searchParams, other = params.get("with")
    const raw = params.get("cursor"), cursor = raw ? parseActivityCursor(raw) : null
    if ((other && !uuid(other)) || (raw && !cursor)) return reply({ error: "Invalid conversation or cursor." }, 400)
    let query = db.from("messages").select(fields)
    query = other ? query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${user.id})`) : query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
    const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51)
    if (error) throw error
    const messages = (data || []).slice(0, 50)
    const ids = [...new Set(other ? [other] : messages.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))]
    const profiles = ids.length ? await db.from("profiles").select("id,full_name,username,avatar_url,tagline").in("id", ids) : { data: [], error: null }
    if (profiles.error) throw profiles.error
    return reply({ messages, profiles: profiles.data || [], viewerId: user.id, nextCursor: (data || []).length > 50 ? activityCursor(messages[messages.length - 1]) : null })
  } catch { return reply({ error: "Messages could not be loaded. Please retry." }, 503) }
}

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return reply({ error: "Sign in to send a message." }, 401)
    const body = await request.json().catch(() => null)
    if (!body || !uuid(body.receiver_id) || typeof body.content !== "string" || !body.content.trim() || body.content.length > MESSAGE_LIMIT || (body.id !== undefined && !uuid(body.id))) return reply({ error: `Enter a message between 1 and ${MESSAGE_LIMIT} characters.` }, 400)
    if (body.receiver_id === user.id) return reply({ error: "You cannot message yourself." }, 400)
    if (body.id) {
      const existing = await db.from("messages").select(fields).eq("id", body.id).eq("sender_id", user.id).maybeSingle()
      if (existing.error) throw existing.error
      if (existing.data) return existing.data.receiver_id === body.receiver_id && existing.data.content === body.content.trim() ? reply({ message: existing.data }) : reply({ error: "This message ID is already in use." }, 409)
    }
    const recipient = await db.from("profiles").select("id").eq("id", body.receiver_id).maybeSingle()
    if (recipient.error) throw recipient.error
    if (!recipient.data) return reply({ error: "This professional is unavailable." }, 404)
    const { data: message, error } = await db.from("messages").insert({ ...(body.id ? { id: body.id } : {}), sender_id: user.id, receiver_id: body.receiver_id, content: body.content.trim(), is_read: false }).select(fields).single()
    if (error) throw error
    return reply({ success: true, message }, 201)
  } catch { return reply({ error: "Delivery could not be confirmed. Retry the same message to check before sending another." }, 503) }
}

export async function PATCH(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return reply({ error: "Sign in to update messages." }, 401)
    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.ids) || !body.ids.length || body.ids.length > 100 || !body.ids.every(uuid)) return reply({ error: "Invalid message IDs." }, 400)
    const { error } = await db.from("messages").update({ is_read: true }).eq("receiver_id", user.id).in("id", body.ids).eq("is_read", false)
    if (error) throw error
    return reply({ success: true })
  } catch { return reply({ error: "Read status could not be updated." }, 503) }
}
