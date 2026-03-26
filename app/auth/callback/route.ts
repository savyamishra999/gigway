import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
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
        // Ensure profile row exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name, profile_completed')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create minimal profile row
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            profile_completed: false,
          }).then(() => null, () => null)
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // If profile not completed or no user_type, send to onboarding
        if (!profile.user_type || !profile.full_name || profile.profile_completed === false) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
