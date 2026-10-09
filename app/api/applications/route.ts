import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user }, error: authError } = await db.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => null)
    if (!body || typeof body.job_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.job_id) || body.cover_letter !== undefined && (typeof body.cover_letter !== "string" || body.cover_letter.length > 5000)) return NextResponse.json({ error: "Provide a valid job. An optional cover letter must be under 5,000 characters." }, { status: 400 })
    const { data: job, error: jobError } = await db.from("jobs").select("id,client_id,poster_id,status").eq("id", body.job_id).maybeSingle()
    if (jobError) return NextResponse.json({ error: "The job could not be checked. Please try again." }, { status: 503 })
    if (!job) return NextResponse.json({ error: "Job unavailable." }, { status: 404 })
    if (job.client_id === user.id || job.poster_id === user.id) return NextResponse.json({ error: "You cannot apply to your own job." }, { status: 403 })
    if (job.status !== "active") return NextResponse.json({ error: "This job is no longer accepting applications." }, { status: 409 })
    const { data: existing, error: lookupError } = await db.from("job_applications").select("id").eq("job_id", job.id).eq("applicant_id", user.id).maybeSingle()
    if (lookupError) return NextResponse.json({ error: "Your application could not be checked. Please try again." }, { status: 503 })
    if (existing) return NextResponse.json({ error: "Already applied." }, { status: 409 })
    // Basic participation is free. No connects deduction or Pro quota.
    const { error } = await db.from("job_applications").insert({ job_id: job.id, applicant_id: user.id, cover_letter: (body.cover_letter || "").trim(), status: "applied" })
    if (error?.code === "23505") return NextResponse.json({ error: "Already applied." }, { status: 409 })
    if (error) return NextResponse.json({ error: "Your application could not be saved. Please try again." }, { status: 503 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: "Your application could not be submitted. Please try again." }, { status: 503 }) }
}
