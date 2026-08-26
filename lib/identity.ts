export const WORK_MODES = [
  { value: "looking_for_work", label: "Find Jobs", color: "text-blue-300" },
  { value: "looking_for_project", label: "Find Freelance Projects", color: "text-violet-300" },
  { value: "offering_services", label: "Offer Services", color: "text-emerald-300" },
  { value: "hiring_talent", label: "Hire Talent", color: "text-amber-300" },
  { value: "grow_network", label: "Grow My Network", color: "text-pink-300" },
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

export type HireAs = "individual" | "company"

export type LegacyRoleMapping = {
  user_roles: string[]
  find_work_type: string | null
  hire_talent_type: string | null
  account_type: string | null
}

// Bridges the modern Work Modes selection (profile_intents) into the legacy
// role-gated fields (user_roles / find_work_type / hire_talent_type / account_type).
// Mirrors the exact semantics EditProfileForm/dashboard/verify already read —
// see lib/roles.ts. Returns null when the selection isn't resolvable yet
// (e.g. "hiring_talent" chosen but hireAs not picked) so callers never guess.
export function mapModesToLegacyRoles(modes: WorkMode[], hireAs: HireAs | null): LegacyRoleMapping | null {
  const offering = modes.includes("offering_services")
  const looking = modes.includes("looking_for_work")
  const hiring = modes.includes("hiring_talent")

  if (!offering && !looking && !hiring) return null

  const user_roles: string[] = []
  let find_work_type: string | null = null
  let hire_talent_type: string | null = null
  let account_type: string | null = null

  if (offering || looking) {
    user_roles.push("find_work")
    find_work_type = offering && looking ? "both" : looking ? "job_seeker" : "freelancer"
  }
  if (hiring && hireAs) {
    user_roles.push("hire_talent")
    hire_talent_type = hireAs
    account_type = hireAs
  }

  return { user_roles, find_work_type, hire_talent_type, account_type }
}
