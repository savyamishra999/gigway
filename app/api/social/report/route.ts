import { NextRequest, NextResponse } from "next/server"
import { plainText, requireSocialUser, resolvePostAccess, socialDb } from "@/lib/social/server"
const reasons = new Set(["spam", "harassment", "misinformation", "scam", "inappropriate", "other"])
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
export async function POST(request: NextRequest) {
  const user = await requireSocialUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const postId = typeof body.postId === "string" ? body.postId : null, commentId = typeof body.commentId === "string" ? body.commentId : null
  if ((postId ? 1 : 0) + (commentId ? 1 : 0) !== 1 || !uuid.test(postId || commentId || "") || !reasons.has(body.reason)) return NextResponse.json({ error: "Choose one valid item and report reason." }, { status: 400 })
  const details = body.details === undefined ? null : plainText(body.details, 1000, 0)
  if (body.details !== undefined && details === null) return NextResponse.json({ error: "Report details must be plain text under 1,000 characters." }, { status: 400 })
  try {
    const db = socialDb()
    if (postId) {
      if (!(await resolvePostAccess(postId, user.id))) return NextResponse.json({ error: "Item not found." }, { status: 404 })
    } else {
      const comment = await db.from("post_comments").select("post_id,status").eq("id", commentId!).maybeSingle()
      if (comment.error) throw comment.error
      if (!comment.data || comment.data.status !== "published" || !(await resolvePostAccess(comment.data.post_id, user.id))) return NextResponse.json({ error: "Item not found." }, { status: 404 })
    }
    const result = await db.from("content_reports").insert({ reporter_user_id: user.id, post_id: postId, comment_id: commentId, reason: body.reason, details })
    if (result.error) throw result.error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch { return NextResponse.json({ error: "Could not submit report." }, { status: 503 }) }
}
