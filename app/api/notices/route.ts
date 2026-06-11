import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const now = new Date().toISOString()

  const { data: notices, error } = await adminDb
    .from("notices")
    .select("id, title, content, type, show_until, created_at")
    .eq("is_active", true)
    .or(`show_until.is.null,show_until.gt.${now}`)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ notices: [] })
  return NextResponse.json({ notices: notices ?? [] })
}
