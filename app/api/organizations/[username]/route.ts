import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { normalizeUsername, usernameError } from "@/lib/identity"

const adminDb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const allowed = ["name", "username", "website", "logo_url", "cover_url", "tagline", "description", "industry", "company_size", "location", "country", "founded_year", "entity_type"] as const
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { username: currentUsername } = await params; const { data: org } = await adminDb.from("organizations").select("id").eq("username", currentUsername).maybeSingle(); if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { data: membership } = await adminDb.from("organization_members").select("member_role").eq("organization_id", org.id).eq("profile_id", user.id).eq("status", "active").maybeSingle(); if (!membership || !["owner", "admin"].includes(membership.member_role)) return NextResponse.json({ error: "Only organization owners and admins can edit this identity." }, { status: 403 })
  const body = await request.json(); const update: Record<string, unknown> = {}; for (const key of allowed) if (body[key] !== undefined) update[key] = key === "founded_year" && body[key] ? Number(body[key]) : String(body[key] ?? "").trim() || null
  if (update.entity_type && !["company", "organization"].includes(String(update.entity_type))) return NextResponse.json({ error: "Entity type must be Company or Organization." }, { status: 400 })
  if (update.username) { const invalid = usernameError(String(update.username)); if (invalid) return NextResponse.json({ error: invalid }, { status: 400 }); update.username = normalizeUsername(String(update.username)) }; if (update.name !== undefined && !update.name) return NextResponse.json({ error: "Company name is required." }, { status: 400 })
  const { data, error } = await adminDb.from("organizations").update(update).eq("id", org.id).select("username").single(); if (error) return NextResponse.json({ error: error.code === "23505" ? "That organization username is already taken." : error.message }, { status: 409 }); return NextResponse.json({ organization: data })
}
