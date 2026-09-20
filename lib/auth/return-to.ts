export function safeReturnTo(value: unknown, fallback = "/home") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback
  // Check decoded input too: browsers strip controls and normalize backslashes.
  // Never allow an auth trampoline to become the final destination.
  try {
    let decoded = value
    for (let i = 0; i < 3; i++) {
      if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith("//")) return fallback
      const url = new URL(decoded, "https://gigway.invalid")
      if (url.origin !== "https://gigway.invalid") return fallback
      if (/^\/(?:login|auth|onboarding|profile\/complete)(?:\/|$)/i.test(url.pathname)) return fallback
      const next = decodeURIComponent(decoded)
      if (next === decoded) return value
      decoded = next
    }
    return fallback
  } catch { return fallback }
}

export function loginHref(next?: string | null, join = false) {
  const params = new URLSearchParams()
  if (join) params.set("mode", "join")
  const destination = safeReturnTo(next, "")
  if (destination) params.set("next", destination)
  const query = params.toString()
  return `/login${query ? `?${query}` : ""}`
}

export function completionHref(next?: string | null) {
  const destination = safeReturnTo(next, "")
  return `/profile/complete${destination ? `?next=${encodeURIComponent(destination)}` : ""}`
}

export function authenticatedRootDestination(pathname: string, authenticated: boolean) {
  return authenticated && pathname === "/" ? "/auth/post-login" : null
}
