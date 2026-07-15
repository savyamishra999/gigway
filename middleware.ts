import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Build a client that can refresh session tokens via cookies
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
        })
      },
    },
  })

  // getSession reads from cookie — fast, no network call
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // ── Protected routes — must be logged in ────────────────────────────────────
  const authRequired = [
    "/dashboard",
    "/profile/complete",
    "/profile/edit",
    "/messages",
    "/notifications",
    "/gigs/new",
    "/jobs/new",
    "/projects/new",
    "/verify",
    "/saved",
    "/admin",
  ]

  const needsAuth = authRequired.some(p => pathname === p || pathname.startsWith(p + "/"))

  if (needsAuth && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin redirect — if admin hits /dashboard send to /admin ────────────────
  if (session && pathname === "/dashboard") {
    if (ADMIN_EMAILS.includes((session.user.email ?? "").toLowerCase())) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  // ── Referral tracking ────────────────────────────────────────────────────────
  const refCode = req.nextUrl.searchParams.get("ref")
  if (refCode && /^[a-z0-9]{6,12}$/.test(refCode)) {
    res.cookies.set("gigway_ref", refCode, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })

    // Fire-and-forget affiliate click
    const clickClient = createServerClient(supabaseUrl, supabaseKey, {
      cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
    })
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip") || "unknown"
    clickClient.from("affiliate_clicks")
      .insert({ ref_code: refCode, ip_address: ip })
      .then(() => null, () => null)
  }

  // Expose pathname for server components (admin sidebar active state)
  res.headers.set("x-pathname", pathname)

  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
