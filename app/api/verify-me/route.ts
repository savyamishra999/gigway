import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verificationDocument } from "@/lib/identity/verification-document"
import { VERIFICATION_COLLECTION_ENABLED } from "@/lib/billing/launch"

export async function POST(req: NextRequest) {
  if (!VERIFICATION_COLLECTION_ENABLED) return NextResponse.json({ error: "Document collection is temporarily paused while privacy controls are reviewed." }, { status: 503 })
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

  const doc = verificationDocument(doc_type, doc_value)
  if (!doc) return NextResponse.json({ error: "Use a valid HTTPS LinkedIn profile URL or only the last four Aadhaar digits." }, { status: 400 })

  // Check that user has paid (verification_status should be "pending")
  const { data: profile } = await supabase
    .from("own_profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single()

  if (profile?.verification_status !== "pending") {
    return NextResponse.json(
      { error: "No pending verification found. Please complete payment first." },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("profiles")
    .update({ verification_doc: doc })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
