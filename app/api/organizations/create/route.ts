import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { normalizeUsername, usernameError } from "@/lib/identity"

const adminDb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const fields = ["name", "website", "logo_url", "cover_url", "tagline", "description", "industry", "company_size", "location", "country", "founded_year"] as const

export async function POST(request: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json(); const name = String(body.name ?? "").trim(); const username = normalizeUsername(String(body.username ?? "")); const invalid = usernameError(username)
  if (!name) return NextResponse.json({ error: "Company name is required." }, { status: 400 }); if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
  const organization: Record<string, unknown> = { name, username, created_by: user.id }
  for (const field of fields) if (body[field] !== undefined && body[field] !== "") organization[field] = field === "founded_year" ? Number(body[field]) : String(body[field]).trim()
  const { data: created, error: createError } = await adminDb.from("organizations").insert(organization).select("id, username").single()
  if (createError || !created) return NextResponse.json({ error: createError?.code === "23505" ? "That organization username is already taken." : createError?.message || "Could not create organization." }, { status: 409 })
  const { error: memberError } = await adminDb.from("organization_members").insert({ organization_id: created.id, profile_id: user.id, member_role: "owner", status: "active", is_primary: true })
  if (memberError) { const { error: cleanupError } = await adminDb.from("organizations").delete().eq("id", created.id); console.error("organization membership failed", memberError.message, cleanupError?.message); return NextResponse.json({ error: "Organization could not be completed; no company profile was created." }, { status: 500 }) }
  return NextResponse.json({ organization: created }, { status: 201 })
}
