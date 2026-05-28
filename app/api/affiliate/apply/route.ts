import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function generateRefCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 6).toLowerCase()
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${suffix}`
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; phone?: string; platform_link?: string; how_promote?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { name, email, phone, platform_link, how_promote } = body

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !platform_link?.trim() || !how_promote?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  if (how_promote.trim().length < 50) {
    return NextResponse.json({ error: "Please describe your promotion plan (min 50 characters)" }, { status: 400 })
  }

  const supabase = await createClient()

  // Check duplicate email
  const { data: existing } = await supabase
    .from("affiliates")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "An application with this email already exists" }, { status: 409 })
  }

  // Link to logged-in user if any
  const { data: { user } } = await supabase.auth.getUser()

  // Generate unique ref_code
  let ref_code = generateRefCode(name)
  let attempts = 0
  while (attempts < 5) {
    const { data: clash } = await supabase
      .from("affiliates").select("id").eq("ref_code", ref_code).maybeSingle()
    if (!clash) break
    ref_code = generateRefCode(name)
    attempts++
  }

  const { error } = await supabase.from("affiliates").insert({
    user_id: user?.id ?? null,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    platform_link: platform_link.trim(),
    how_promote: how_promote.trim(),
    ref_code,
    status: "pending",
  })

  if (error) {
    console.error("[affiliate/apply]", error.message)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }

  return NextResponse.json({ success: true, ref_code })
}
