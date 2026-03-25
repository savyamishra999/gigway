import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { reviewee_id, project_id, rating, comment } = body

  if (!reviewee_id || !project_id || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }

  if (reviewee_id === user.id) {
    return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 })
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", reviewee_id)
    .eq("project_id", project_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this user for this project" }, { status: 409 })
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_id: user.id,
      reviewee_id,
      project_id,
      rating: parseInt(rating),
      comment: comment || null,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify reviewee
  await supabase.from("notifications").insert({
    user_id: reviewee_id,
    type: "new_review",
    message: `You received a ${rating}-star review!`,
    link: `/profile`,
    is_read: false,
  })

  return NextResponse.json({ success: true, review_id: review.id }, { status: 201 })
}
