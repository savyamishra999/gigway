import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
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
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Admin shortcut — check before profile lookup
        const adminEmails = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
          .split(",").map(e => e.trim().toLowerCase())
        if (adminEmails.includes((user.email ?? "").toLowerCase())) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('id', user.id)
          .single()

        if (!profile) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            profile_completed: false,
          }).then(() => null, () => null)

          // Referral bonus: check cookie for ref code
          const refCookie = cookieStore.get("gigway_ref")?.value
          if (refCookie) {
            const { data: referrer } = await supabase
              .from("profiles")
              .select("id")
              .eq("user_ref_code", refCookie)
              .neq("id", user.id)
              .single()

            if (referrer) {
              // Give both users 5 connects
              await Promise.all([
                supabase.rpc("increment_connects", { uid: user.id, amount: 5 }),
                supabase.rpc("increment_connects", { uid: referrer.id, amount: 5 }),
                supabase.from("connects_transactions").insert([
                  { user_id: user.id,      amount: 5, type: "referral_bonus", ref_code: refCookie, note: "Joined via referral" },
                  { user_id: referrer.id,  amount: 5, type: "referral_bonus", ref_code: refCookie, note: "Friend joined via your link" },
                ]),
              ])
              // Clear the ref cookie
              cookieStore.set({ name: "gigway_ref", value: "", maxAge: 0 })
            }
          }

          return NextResponse.redirect(new URL('/profile/complete', request.url))
        }

        if (profile.profile_completed === false) {
          return NextResponse.redirect(new URL('/profile/complete', request.url))
        }

        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
