import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { boundedFetch, withDeadline } from "@/lib/async"
import { authenticatedRootDestination, safeReturnTo } from "@/lib/auth/return-to"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export async function middleware(req: NextRequest) {
  const startedAt = Date.now()
  const pathname = req.nextUrl.pathname
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)
  requestHeaders.set("x-gigway-destination", `${pathname}${req.nextUrl.search}`)
  let res = NextResponse.next({ request: { headers: requestHeaders } })
  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url)
    res.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Public identity/content and login must not wait for token refresh. The root
  // route is the exception: it owns the guest-vs-authenticated product choice,
  // so middleware must refresh/read its cookie session before any landing HTML
  // can be served. Authenticated root requests continue through the existing
  // post-login profile/onboarding gate.
  const publicRoute = pathname === "/login" || pathname.startsWith("/u/") || pathname.startsWith("/@") ||
    ["/social/explore", "/social/vijox", "/social/glimps"].includes(pathname) || /^\/social\/posts\/[^/]+$/.test(pathname)
  let session = null
  if (!publicRoute) {
  // Build a client that can refresh session tokens via cookies
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    global: { fetch: boundedFetch },
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        requestHeaders.set("cookie", req.cookies.toString())
        const previousCookies = res.cookies.getAll()
        res = NextResponse.next({ request: { headers: requestHeaders } })
        previousCookies.forEach(cookie => res.cookies.set(cookie))
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
        })
      },
    },
  })

    try {
      const result = await withDeadline(supabase.auth.getSession())
      if (result.error) throw result.error
      session = result.data.session
      if (process.env.NODE_ENV === "development" || process.env.GIGWAY_PERF_DIAGNOSTICS === "1") {
        console.info("gigway_perf", { stage: "middleware_auth", pathname, durationMs: Date.now() - startedAt, authenticated: !!session })
      }
    } catch {
      // Keep the destination and give the user a finite retry, not a false logout.
      return new NextResponse("Your session could not be checked. Please reload to try again.", {
        status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" },
      })
    }
  }

  const rootDestination = authenticatedRootDestination(pathname, !!session)
  if (rootDestination) {
    return redirectWithCookies(new URL(rootDestination, req.url))
  }

  // ── Protected routes — must be logged in ────────────────────────────────────
  const authRequired = [
    "/dashboard",
    "/workplaces",
    "/profile",
    "/organizations",
    "/subscribe",
    "/verify-me",
    "/buy-connects",
    "/payment/success",
    "/refer",
    "/affiliate/dashboard",
    "/network",
    "/create",
    "/tools",
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

  const needsAuth = authRequired.some(p => pathname === p || pathname.startsWith(p + "/")) || /^\/(?:jobs|gigs|projects)\/[^/]+\/(?:edit|proposals)$/.test(pathname) || /^\/social\/(?:glimps|vijox)?\/?create$/.test(pathname)

  if (needsAuth && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", safeReturnTo(`${pathname}${req.nextUrl.search}`, safeReturnTo(req.nextUrl.searchParams.get("next"))))
    return redirectWithCookies(loginUrl)
  }

  // ── Admin redirect — if admin hits /dashboard send to /admin ────────────────
  if (session && pathname === "/dashboard") {
    if (ADMIN_EMAILS.includes((session.user.email ?? "").toLowerCase())) {
      return redirectWithCookies(new URL("/admin", req.url))
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
    "/((?!api(?:/|$)|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
