import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkUsernameClaim } from "@/lib/identity/username-server"

export async function GET(request: NextRequest) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const check = await checkUsernameClaim(request.nextUrl.searchParams.get("username"), { table: "profiles", id: user.id })
  return NextResponse.json({ available: !check.error, ...(check.error ? { error: check.error } : {}) }, { status: check.status, headers: { "Cache-Control": "no-store" } })
}
