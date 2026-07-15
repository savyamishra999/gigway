import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) return null
  return user
}

// PATCH — verify, ban, or unban employer
export async function PATCH(req: NextRequest) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, action } = await req.json()
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 })

  if (action === "verify") {
    const { error } = await adminDb
      .from("profiles")
      .update({ is_employer_verified: true })
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send verification notification
    await adminDb.from("notifications").insert({
      user_id: id,
      title: "Company Verified! ✅",
      message: "Your company has been verified by the GigWay team. You now have a Verified Company badge.",
      type: "verification",
    }).select()

    return NextResponse.json({ success: true, action: "verify" })
  }

  if (action === "ban") {
    const { error } = await adminDb
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: "ban" })
  }

  if (action === "unban") {
    const { error } = await adminDb
      .from("profiles")
      .update({ is_banned: false })
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: "unban" })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

// DELETE — remove employer profile
export async function DELETE(req: NextRequest) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await adminDb.from("profiles").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
