import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "verification-docs"
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

function ext(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png",
    "image/webp": "webp", "application/pdf": "pdf",
  }
  return map[mime] ?? "jpg"
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Must have paid
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_paid_at, verification_status")
    .eq("id", user.id)
    .single()

  if (!profile?.verification_paid_at) {
    return NextResponse.json({ error: "Payment required first" }, { status: 403 })
  }
  if (profile.verification_status === "pending") {
    return NextResponse.json({ error: "Documents already submitted" }, { status: 409 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const frontFile = formData.get("front") as File | null
  const backFile  = formData.get("back")  as File | null

  if (!frontFile || !backFile) {
    return NextResponse.json({ error: "Both front and back files are required" }, { status: 400 })
  }

  for (const [side, file] of [["front", frontFile], ["back", backFile]] as const) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `${side} file must be under 5 MB` }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `${side} file must be JPG, PNG, WebP, or PDF` }, { status: 400 })
    }
  }

  // Upload both files to Supabase Storage
  async function upload(file: File, side: "front" | "back"): Promise<string> {
    if (!user) throw new Error("User not authenticated")
    const path = `${user.id}/${side}.${ext(file.type)}`
    const bytes = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true })
    if (error) throw new Error(`Failed to upload ${side}: ${error.message}`)
    return path
  }

  try {
    const [frontPath, backPath] = await Promise.all([
      upload(frontFile, "front"),
      upload(backFile, "back"),
    ])

    const { error } = await supabase
      .from("profiles")
      .update({
        aadhaar_front_url: frontPath,
        aadhaar_back_url:  backPath,
        verification_status: "pending",
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to save document paths" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed"
    console.error("[verify-me/upload]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
