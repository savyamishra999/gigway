import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
  const { title, description, category, job_type, budget, location, skills_required } = body

  if (!title || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      client_id: user.id,
      title,
      description,
      category,
      job_type: job_type || "full-time",
      budget: budget ? parseFloat(budget) : null,
      location: location || null,
      skills_required: skills_required || [],
      status: "active",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, job_id: job.id }, { status: 201 })
}
