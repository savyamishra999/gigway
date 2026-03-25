import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const withUserId = searchParams.get("with")

  if (!withUserId) {
    return NextResponse.json({ error: "Missing 'with' parameter" }, { status: 400 })
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", withUserId)
    .eq("is_read", false)

  return NextResponse.json({ messages: messages || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { receiver_id, content, project_id } = body

  if (!receiver_id || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (receiver_id === user.id) {
    return NextResponse.json({ error: "Cannot send message to yourself" }, { status: 400 })
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id,
      content,
      project_id: project_id || null,
      is_read: false,
    })
    .select("id, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message }, { status: 201 })
}
