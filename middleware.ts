import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ── Admin dashboard shortcut ───────────────────────────────────────────────
  // If an admin lands on /dashboard, redirect them to /admin instead
  if (req.nextUrl.pathname === "/dashboard") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const tmpClient = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    })
    const { data: { user } } = await tmpClient.auth.getUser()
    if (user && ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  // ── Referral tracking ──────────────────────────────────────────────────────
  const refCode = req.nextUrl.searchParams.get("ref")
  if (refCode && /^[a-z0-9]{6,12}$/.test(refCode)) {
    res.cookies.set("gigway_ref", refCode, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Non-blocking click log — fire and forget
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    })

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown"

    supabase.from("affiliate_clicks").insert({ ref_code: refCode, ip_address: ip })
      .then(() => null, () => null)
  }

  // ── Supabase auth session refresh ─────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
        })
      },
    },
  })

  // Expose pathname for server components (e.g. admin sidebar active states)
  res.headers.set("x-pathname", req.nextUrl.pathname)

  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
