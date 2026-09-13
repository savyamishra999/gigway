export function safeReturnTo(value: unknown, fallback = "/home") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback
  return value
}

export function loginHref(next?: string | null, join = false) {
  const params = new URLSearchParams()
  if (join) params.set("mode", "join")
  const destination = safeReturnTo(next, "")
  if (destination) params.set("next", destination)
  const query = params.toString()
  return `/login${query ? `?${query}` : ""}`
}
