export function verificationDocument(type: unknown, value: unknown): string | null {
  if (typeof value !== "string") return null
  if (type === "aadhaar") return /^\d{4}$/.test(value) ? `aadhaar:${value}` : null
  if (type !== "linkedin") return null
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(url.hostname) || url.username || url.password || url.port || !/^\/in\/[^/]+\/?$/.test(url.pathname)) return null
    return `linkedin:https://www.linkedin.com${url.pathname}`
  } catch { return null }
}
