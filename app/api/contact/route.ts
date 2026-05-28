import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { name, email, subject, message } = body

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  if (message.length > 500) {
    return NextResponse.json({ error: "Message must be under 500 characters" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from("support_tickets").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
  })

  if (error) {
    console.error("[contact] insert error:", error.message)
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
