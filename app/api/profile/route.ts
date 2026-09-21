import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUsageLimit, limitResponse } from "@/lib/billing/limits"
import { checkUsernameClaim, USERNAME_UNAVAILABLE } from "@/lib/identity/username-server"

export async function PATCH(request: Request) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const allowed = new Set([
    "full_name", "username", "avatar_url", "tagline", "bio", "location", "phone", "phone_is_public", "is_private",
    "job_function", "skills", "portfolio_links", "hourly_rate", "availability", "experience_years", "experience_description",
    "linkedin_url", "cv_url", "expected_salary", "preferred_job_type", "company_name", "company_size", "company_website", "industry", "gst_number",
  ])
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.has(key)))
  if (typeof updates.phone === "string" && updates.phone.trim()) {
    const digits = updates.phone.replace(/\D/g, "")
    if (digits.length !== 10 && digits.length !== 12) return NextResponse.json({ error: "Enter a valid 10-digit Indian phone number" }, { status: 400 })
  }
  const { data: current } = await db.from("profiles").select("portfolio_links").eq("id", user.id).maybeSingle()
  const before = (current?.portfolio_links as string[] | null) || []
  const next = Array.isArray(updates.portfolio_links) ? updates.portfolio_links : before
  const adds = next.filter((link: string) => !before.includes(link))
  if (adds.length) {
    const usage = await getUsageLimit(db, user.id, "portfolio")
    if (usage.used + adds.length > usage.limit) return NextResponse.json({ ...limitResponse(usage), feature: "portfolio", currentUsage: usage.used, requiredPlan: "pro" }, { status: 403 })
  }
  if (Object.prototype.hasOwnProperty.call(updates, "username")) {
    const check = await checkUsernameClaim(updates.username, { table: "profiles", id: user.id })
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })
    updates.username = check.username
  }
  const { error } = await db.from("profiles").update(updates).eq("id", user.id)
  if (error) return NextResponse.json({ error: error.code === "23505" ? USERNAME_UNAVAILABLE : "Unable to save profile." }, { status: error.code === "23505" ? 409 : 500 })
  return NextResponse.json({ success: true })
}
