import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) return null
  return user
}

// GET — list all ads (admin)
export async function GET() {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await adminDb
    .from("advertisements")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create ad
export async function POST(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, subtitle, cta_text, link_url, image_url, accent_color, target_roles, position, priority, expires_at } = body

  if (!title || !link_url) {
    return NextResponse.json({ error: "title and link_url are required" }, { status: 400 })
  }

  const { data, error } = await adminDb
    .from("advertisements")
    .insert({
      title,
      subtitle:     subtitle     || null,
      cta_text:     cta_text     || "Learn More",
      link_url,
      image_url:    image_url    || null,
      accent_color: accent_color || "#4F46E5",
      target_roles: target_roles || [],
      position:     position     || "all",
      priority:     priority     || 0,
      expires_at:   expires_at   || null,
      is_active:    true,
      created_by:   user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — toggle active or update priority
export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { data, error } = await adminDb
    .from("advertisements")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove ad
export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await adminDb.from("advertisements").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
