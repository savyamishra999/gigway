// Keep in sync with the reviewed SQL allowlists. Never spread request bodies into profiles.
export const OWNER_EDITABLE_PROFILE_FIELDS = [
  "full_name", "username", "avatar_url", "tagline", "bio", "location", "phone", "phone_is_public", "is_private",
  "job_function", "skills", "portfolio_links", "hourly_rate", "availability", "experience_years", "experience_description",
  "linkedin_url", "cv_url", "expected_salary", "preferred_job_type", "company_name", "company_size", "company_website", "industry", "gst_number",
] as const

export function ownerProfileUpdates(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {}
  const allowed = new Set<string>(OWNER_EDITABLE_PROFILE_FIELDS)
  return Object.fromEntries(Object.entries(body).filter(([key]) => allowed.has(key)))
}

// Legacy work preferences influence product access. Only validated server flows write them.
// The unrelated live `roles` column has no established meaning and remains denied.
export function validLegacyWorkPreferences(body: Record<string, unknown>): boolean {
  const roles = body.user_roles
  return Array.isArray(roles) && roles.length > 0 && roles.length <= 2
    && roles.every(role => role === "find_work" || role === "hire_talent")
    && new Set(roles).size === roles.length
    && (body.find_work_type == null || ["freelancer", "job_seeker", "both"].includes(String(body.find_work_type)))
    && (body.hire_talent_type == null || ["individual", "company"].includes(String(body.hire_talent_type)))
    && (body.account_type == null || ["individual", "company"].includes(String(body.account_type)))
}
