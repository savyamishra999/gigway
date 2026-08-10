export const WORK_MODES = [
  { value: "offering_services", label: "Available for Freelance", color: "text-emerald-300" },
  { value: "looking_for_work", label: "Open to Full-time Work", color: "text-blue-300" },
  // The database currently supports the three values above/below. Keep future modes
  // visible in product copy only until their database constraint is deliberately extended.
  { value: "hiring_talent", label: "Hiring", color: "text-amber-300" },
] as const

export type WorkMode = (typeof WORK_MODES)[number]["value"]

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._]{2,29}$/
export const RESERVED_USERNAMES = new Set([
  "admin", "api", "auth", "dashboard", "login", "profile", "settings", "support",
  "jobs", "gigs", "projects", "messages", "notifications", "onboarding", "pricing",
  "about", "terms", "privacy", "explore", "verify", "www",
])

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function usernameError(value: string) {
  if (!USERNAME_PATTERN.test(value)) return "Use 3–30 lowercase letters, numbers, periods, or underscores."
  if (RESERVED_USERNAMES.has(value)) return "That username is reserved. Please choose another."
  return null
}
