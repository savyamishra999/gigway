import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .ilike("email", email.trim())
    .single()

  if (!data) return NextResponse.json({ user: null })
  return NextResponse.json({ user: data })
}
