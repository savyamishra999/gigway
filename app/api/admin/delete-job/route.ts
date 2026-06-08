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

  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

  const { error } = await supabase.from("jobs").delete().eq("id", jobId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
