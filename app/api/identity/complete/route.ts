import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeUsername, usernameError, WORK_MODES } from "@/lib/identity"

export async function POST(request: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // profile_intents.profile_id references public.profiles.id. Resolve the existing
  // personal profile first; never assume an auth UUID is a profile UUID.
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
  if (profileError) return NextResponse.json({ error: `Could not find your personal profile: ${profileError.message}` }, { status: 500 })
  if (!profile) return NextResponse.json({ error: "Your personal profile is unavailable. Work Modes were not changed; please contact support." }, { status: 409 })
  const profileId = profile.id
  const body = await request.json(); const modes = Array.isArray(body.modes) ? body.modes.filter((m: unknown) => WORK_MODES.some(x => x.value === m)) : []
  if (body.username !== undefined) { const username = normalizeUsername(String(body.username)); const invalid = usernameError(username); if (invalid) return NextResponse.json({ error: invalid }, { status: 400 }); const { error } = await supabase.from("profiles").update({ username, profile_completed: true }).eq("id", profileId); if (error) return NextResponse.json({ error: error.code === "23505" ? "That username is already taken." : error.message }, { status: 409 }) } else { const { error } = await supabase.from("profiles").update({ profile_completed: true }).eq("id", profileId); if (error) return NextResponse.json({ error: error.message }, { status: 500 }) }
  // Replace only this user's explicit preferences; no legacy fields are touched.
  const { data: existingIntents, error: existingError } = await supabase.from("profile_intents").select("intent_type").eq("profile_id", profileId)
  if (existingError) return NextResponse.json({ error: `Work Modes could not be read: ${existingError.message}` }, { status: 403 })
  const { error: deactivateError } = await supabase.from("profile_intents").update({ is_active: false }).eq("profile_id", profileId)
  if (deactivateError) return NextResponse.json({ error: `Work Modes could not be saved: ${deactivateError.message}` }, { status: 403 })
  for (const intent of modes) { const query = (existingIntents ?? []).some(row => row.intent_type === intent) ? supabase.from("profile_intents").update({ is_active: true }).eq("profile_id", profileId).eq("intent_type", intent) : supabase.from("profile_intents").insert({ profile_id: profileId, intent_type: intent, is_active: true }); const { error } = await query; if (error) return NextResponse.json({ error: `Work Modes could not be saved: ${error.message}` }, { status: 403 }) }
  return NextResponse.json({ success: true })
}
