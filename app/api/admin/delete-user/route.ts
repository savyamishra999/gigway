import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })

  // Use service role client to delete auth user (cascades to profiles via FK)
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Delete profile data first (gigs, jobs, projects cascade if FK set)
  await adminClient.from("profiles").delete().eq("id", userId)

  // Delete auth user
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    console.error("[delete-user]", error.message)
    // Profile already deleted; auth delete failed — non-fatal
  }

  return NextResponse.json({ success: true })
}
