import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) return null
  return user
}

// POST — create notice
export async function POST(req: NextRequest) {
  const user = await getAdmin(req)
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { title, content, type, show_until } = await req.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 })
  }

  const { data, error } = await adminDb.from("notices").insert({
    title: title.trim(),
    content: content.trim(),
    type: type || "info",
    show_until: show_until || null,
    created_by: user.email,
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notice: data })
}

// PATCH — toggle active or update
export async function PATCH(req: NextRequest) {
  const user = await getAdmin(req)
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await adminDb.from("notices").update({ is_active }).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await getAdmin(req)
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await adminDb.from("notices").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
