import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { canManageJob } from "@/lib/jobs/server"

const editable = ["title", "description", "company_name", "location", "job_type", "salary_min", "salary_max", "skills_required", "category", "experience_required", "deadline"] as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params; const { data: job } = await db.from("jobs").select("id,client_id,poster_id,organization_id").eq("id", id).maybeSingle(); if (!job || !(await canManageJob(user.id, job))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return NextResponse.json({ allowed: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params; const { data: job } = await db.from("jobs").select("id,client_id,poster_id,organization_id").eq("id", id).maybeSingle(); if (!job || !(await canManageJob(user.id, job))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await request.json().catch(() => ({})); const update: Record<string, unknown> = {}
  for (const key of editable) if (body[key] !== undefined) update[key] = body[key]
  const { error } = await db.from("jobs").update(update).eq("id", id); if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params; const { data: job } = await db.from("jobs").select("id,client_id,poster_id,organization_id").eq("id", id).maybeSingle(); if (!job || !(await canManageJob(user.id, job))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { error } = await db.from("jobs").update({ status: "deleted" }).eq("id", id); if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
