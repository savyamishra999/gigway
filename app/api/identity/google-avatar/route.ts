import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { boundedFetch, withDeadline } from "@/lib/async"

const MAX_BYTES = 5 * 1024 * 1024
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function POST() {
  const db = await createClient()
  const { data: { user }, error: userError } = await withDeadline(db.auth.getUser())
  if (userError || !user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 })

  const { data: profile, error: profileError } = await db.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
  if (profileError) return NextResponse.json({ error: "Your profile photo could not be checked. Please try again." }, { status: 503 })
  if (profile?.avatar_url) return NextResponse.json({ error: "Your existing GigWay photo was kept." }, { status: 409 })

  const source = user.user_metadata?.avatar_url ?? user.user_metadata?.picture
  if (typeof source !== "string") return NextResponse.json({ error: "Google did not provide a profile photo." }, { status: 404 })

  let url: URL
  try { url = new URL(source) } catch { return NextResponse.json({ error: "Google photo is unavailable." }, { status: 400 }) }
  if (url.protocol !== "https:" || !(url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com"))) {
    return NextResponse.json({ error: "Google photo is unavailable." }, { status: 400 })
  }

  try {
    const response = await withDeadline(boundedFetch(url, { redirect: "error" }))
    if (!response.ok) throw new Error("download")
    const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase()
    const extension = MIME_EXTENSIONS[mime]
    const declaredSize = Number(response.headers.get("content-length") || 0)
    if (!extension || declaredSize > MAX_BYTES) return NextResponse.json({ error: "Google photo format or size is unsupported. Upload a photo instead." }, { status: 415 })
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_BYTES) return NextResponse.json({ error: "Google photo is too large. Upload a smaller photo instead." }, { status: 413 })

    const path = `${user.id}/avatars/google-${crypto.randomUUID()}.${extension}`
    const upload = await db.storage.from("avatars").upload(path, bytes, { contentType: mime, upsert: false })
    if (upload.error) return NextResponse.json({ error: "Google photo could not be saved. Upload a photo or skip for now." }, { status: 503 })
    return NextResponse.json({ avatarUrl: db.storage.from("avatars").getPublicUrl(path).data.publicUrl })
  } catch {
    return NextResponse.json({ error: "Google photo could not be imported. Upload a photo or skip for now." }, { status: 503 })
  }
}
