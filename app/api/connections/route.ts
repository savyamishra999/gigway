import { NextResponse } from "next/server"
import { requireSocialUser, socialDb } from "@/lib/social/server"

const PAGE_SIZE = 30
function validCursor(value: string) {
  const [createdAt, id, extra] = value.split("|")
  if (extra || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(createdAt || "") || !Number.isFinite(Date.parse(createdAt)) || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id || "")) return null
  return { createdAt, id }
}
export async function GET(request: Request) {
  const user = await requireSocialUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const raw = new URL(request.url).searchParams.get("cursor"), cursor = raw ? validCursor(raw) : null
  if (raw && !cursor) return NextResponse.json({ error: "Invalid network cursor." }, { status: 400 })
  try {
    const db = socialDb()
    // Keep both directions scoped to the verified viewer, including on continuation.
    let query = db.from("professional_connections").select("id,requester_user_id,recipient_user_id,status,created_at")
      .or(`requester_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`).in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE + 1)
    if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
    const { data, error } = await query
    if (error) throw error
    const rows = (data || []).slice(0, PAGE_SIZE), more = (data || []).length > PAGE_SIZE
    const ids = [...new Set(rows.map(row => row.requester_user_id === user.id ? row.recipient_user_id : row.requester_user_id))]
    const profiles = ids.length ? await db.from("profiles").select("id,full_name,username,avatar_url,tagline,location,is_verified").in("id", ids) : { data: [], error: null }
    if (profiles.error) throw profiles.error
    const map = new Map((profiles.data || []).map(profile => [profile.id, profile]))
    const item = (row: typeof rows[number]) => ({ id: row.id, profile: map.get(row.requester_user_id === user.id ? row.recipient_user_id : row.requester_user_id) })
    const marker = more ? rows.at(-1) : null
    return NextResponse.json({
      requests: rows.filter(row => row.status === "pending" && row.recipient_user_id === user.id).map(item),
      connections: rows.filter(row => row.status === "accepted").map(item),
      nextCursor: marker ? `${marker.created_at}|${marker.id}` : null,
    })
  } catch { return NextResponse.json({ error: "Could not load connections." }, { status: 503 }) }
}
