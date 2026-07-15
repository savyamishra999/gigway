import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )

  // Get user directly from the exchange — don't call getUser() separately
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    console.error("[auth/callback] exchangeCodeForSession error:", error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Admin shortcut
  const adminEmails = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
    .split(",").map(e => e.trim().toLowerCase())
  if (adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.redirect(`${origin}/admin`)
  }

  // Check profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, user_roles")
    .eq("id", user.id)
    .single()

  if (!profile) {
    // New user — create profile with Google metadata
    await supabase.from("profiles").insert({
      id:               user.id,
      email:            user.email,
      full_name:        user.user_metadata?.full_name   ?? null,
      avatar_url:       user.user_metadata?.avatar_url  ?? null,
      profile_completed: false,
      user_roles:       [],
    }).then(() => null, (e) => console.error("[auth/callback] profile insert:", e))

    // Referral bonus
    const refCookie = cookieStore.get("gigway_ref")?.value
    if (refCookie) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_ref_code", refCookie)
        .neq("id", user.id)
        .single()

      if (referrer) {
        await Promise.allSettled([
          supabase.rpc("increment_connects", { uid: user.id,      amount: 5 }),
          supabase.rpc("increment_connects", { uid: referrer.id,  amount: 5 }),
          supabase.from("connects_transactions").insert([
            { user_id: user.id,      amount: 5, type: "referral_bonus", ref_code: refCookie, note: "Joined via referral" },
            { user_id: referrer.id,  amount: 5, type: "referral_bonus", ref_code: refCookie, note: "Friend joined via your link" },
          ]),
        ])
        cookieStore.set({ name: "gigway_ref", value: "", maxAge: 0 })
      }
    }

    return NextResponse.redirect(`${origin}/profile/complete`)
  }

  // profile exists — but if user_roles is empty, onboarding was never finished
  const onboardingDone = profile.profile_completed && (profile.user_roles ?? []).length > 0
  if (!onboardingDone) {
    return NextResponse.redirect(`${origin}/profile/complete`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
