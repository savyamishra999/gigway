import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { doc_type?: string; doc_value?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { doc_type, doc_value } = body

  if (!doc_type || !doc_value) {
    return NextResponse.json({ error: "doc_type and doc_value are required" }, { status: 400 })
  }

  // Validate
  if (doc_type === "linkedin") {
    if (!doc_value.includes("linkedin.com")) {
      return NextResponse.json({ error: "Invalid LinkedIn URL" }, { status: 400 })
    }
  } else if (doc_type === "aadhaar") {
    if (!/^\d{4}$/.test(doc_value)) {
      return NextResponse.json({ error: "Aadhaar must be exactly 4 digits" }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: "Invalid doc_type" }, { status: 400 })
  }

  // Check that user has paid (verification_status should be "pending")
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single()

  if (profile?.verification_status !== "pending") {
    return NextResponse.json(
      { error: "No pending verification found. Please complete payment first." },
      { status: 403 }
    )
  }

  const doc = `${doc_type}:${doc_value}`
  const { error } = await supabase
    .from("profiles")
    .update({ verification_doc: doc })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
