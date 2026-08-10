import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeUsername, usernameError, WORK_MODES } from "@/lib/identity"

export async function POST(request: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json(); const modes = Array.isArray(body.modes) ? body.modes.filter((m: unknown) => WORK_MODES.some(x => x.value === m)) : []
  if (body.username !== undefined) { const username = normalizeUsername(String(body.username)); const invalid = usernameError(username); if (invalid) return NextResponse.json({ error: invalid }, { status: 400 }); const { error } = await supabase.from("profiles").update({ username, profile_completed: true }).eq("id", user.id); if (error) return NextResponse.json({ error: error.code === "23505" ? "That username is already taken." : error.message }, { status: 409 }) } else { const { error } = await supabase.from("profiles").update({ profile_completed: true }).eq("id", user.id); if (error) return NextResponse.json({ error: error.message }, { status: 500 }) }
  // Replace only this user's explicit preferences; no legacy fields are touched.
  const { error: deleteError } = await supabase.from("profile_intents").delete().eq("profile_id", user.id)
  if (deleteError) return NextResponse.json({ error: `Work Modes could not be saved: ${deleteError.message}` }, { status: 403 })
  if (modes.length) { const { error } = await supabase.from("profile_intents").insert(modes.map((intent: string) => ({ profile_id: user.id, intent }))); if (error) return NextResponse.json({ error: `Work Modes could not be saved: ${error.message}` }, { status: 403 }) }
  return NextResponse.json({ success: true })
}
