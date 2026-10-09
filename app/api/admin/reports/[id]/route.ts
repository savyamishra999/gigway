import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { adminViewer } from "@/lib/admin/access"
import { boundedFetch } from "@/lib/async"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminViewer())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params, body = await request.json().catch(() => ({}))
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id) || !["reviewed", "dismissed"].includes(body.status)) return NextResponse.json({ error: "Choose a valid review action." }, { status: 400 })
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: boundedFetch } })
    const result = await db.from("content_reports").update({ status: body.status }).eq("id", id).eq("status", "open").select("id,status").maybeSingle()
    if (result.error) throw result.error
    if (!result.data) return NextResponse.json({ error: "This report has already changed. Reload the queue." }, { status: 409 })
    return NextResponse.json({ status: result.data.status })
  } catch { return NextResponse.json({ error: "The review could not be saved." }, { status: 503 }) }
}
