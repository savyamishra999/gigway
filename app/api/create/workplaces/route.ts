import { NextResponse } from "next/server"
import { getViewer } from "@/lib/auth/server"
import { createClient } from "@/lib/supabase/server"
import { withDeadline } from "@/lib/async"

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" }
  try {
    const user = await getViewer()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers })
    const db = await createClient()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const { data, error } = await withDeadline(db.from("organization_members")
        .select("organizations(id,name,logo_url)")
        .eq("profile_id", user.id).eq("status", "active").in("member_role", ["owner", "admin"])
        .abortSignal(controller.signal), 5000)
      if (error) throw error
      const organizations = (data || []).flatMap(row => {
        const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
        return org ? [{ id: org.id, name: org.name, avatar: org.logo_url }] : []
      })
      return NextResponse.json({ viewerId: user.id, organizations }, { headers })
    } finally { clearTimeout(timer); controller.abort() }
  } catch {
    return NextResponse.json({ error: "Workplaces could not be loaded. Please retry." }, { status: 503, headers })
  }
}
