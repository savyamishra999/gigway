import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { gigId } = await req.json()
  if (!gigId) return NextResponse.json({ error: "gigId required" }, { status: 400 })

  const { error } = await supabase.from("gigs").delete().eq("id", gigId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
