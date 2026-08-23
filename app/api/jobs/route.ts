import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUsageLimit, limitResponse } from "@/lib/billing/limits"
import { canPostAsOrganization } from "@/lib/social/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const job_type = searchParams.get("job_type")
  const search = searchParams.get("search")

  let query = supabase
    .from("jobs")
    .select("*, profiles:client_id(full_name, company, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (category) query = query.eq("category", category)
  if (job_type) query = query.eq("job_type", job_type)

  const { data: jobs, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let results = jobs || []

  if (search) {
    const s = search.toLowerCase()
    results = results.filter(
      (j: { title?: string; description?: string }) =>
        j.title?.toLowerCase().includes(s) ||
        j.description?.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({ jobs: results })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category, job_type, budget, location, skills_required, company_name, salary_min, salary_max, experience_required, deadline } = body

  if (!title || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const usage = await getUsageLimit(supabase, user.id, "jobs")
  if (!usage.allowed) return NextResponse.json(limitResponse(usage), { status: 403 })

  let organizationId: string | null = null
  if (typeof body.organizationId === "string" && body.organizationId) {
    const access = await canPostAsOrganization(user.id, body.organizationId)
    if (!access.allowed) return NextResponse.json({ error: "Only organization owners and admins can post jobs for this entity." }, { status: 403 })
    organizationId = body.organizationId
  }
  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      poster_id: user.id,
      client_id: user.id,
      organization_id: organizationId,
      title,
      description,
      category,
      job_type: job_type || "full-time",
      budget: budget ? parseFloat(budget) : null,
      company_name: company_name || null,
      location: location || null,
      salary_min: Number.isFinite(Number(salary_min)) ? Number(salary_min) : null,
      salary_max: Number.isFinite(Number(salary_max)) ? Number(salary_max) : null,
      skills_required: skills_required || [],
      experience_required: experience_required || null,
      deadline: deadline || null,
      status: "active",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, job_id: job.id }, { status: 201 })
}
