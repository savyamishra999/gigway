import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { project_id, cover_letter, bid_amount, estimated_days } = body

  if (!project_id || !cover_letter || !bid_amount || !estimated_days) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("proposals")
    .select("id")
    .eq("project_id", project_id)
    .eq("freelancer_id", user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: "You have already applied to this project" }, { status: 409 })
  }

  // Check connects balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("connects_balance")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.connects_balance ?? 0) < 1) {
    return NextResponse.json({ error: "Insufficient connects balance" }, { status: 402 })
  }

  // Insert proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      project_id,
      freelancer_id: user.id,
      cover_letter,
      bid_amount: parseFloat(bid_amount),
      estimated_days: parseInt(estimated_days),
      status: "pending",
    })
    .select("id")
    .single()

  if (proposalError) {
    return NextResponse.json({ error: proposalError.message }, { status: 500 })
  }

  // Deduct 1 connect
  await supabase
    .from("profiles")
    .update({ connects_balance: (profile.connects_balance ?? 1) - 1 })
    .eq("id", user.id)

  // Log transaction
  await supabase.from("connects_transactions").insert({
    user_id: user.id,
    amount: -1,
    type: "debit",
    description: `Proposal submitted for project ${project_id}`,
  })

  // Fetch project client_id to notify
  const { data: project } = await supabase
    .from("projects")
    .select("client_id, title")
    .eq("id", project_id)
    .single()

  if (project) {
    await supabase.from("notifications").insert({
      user_id: project.client_id,
      type: "new_proposal",
      message: `You received a new proposal for "${project.title}"`,
      link: `/projects/${project_id}/proposals`,
      is_read: false,
    })
  }

  return NextResponse.json({ success: true, proposal_id: proposal.id }, { status: 201 })
}
