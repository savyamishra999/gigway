// Centralized role determination for the legacy role-gated profile system.
//
// Source of truth remains: profiles.user_roles / find_work_type / hire_talent_type / account_type.
// This module only reads those fields — it never writes them. See app/api/identity/complete/route.ts
// for the one place that bridges the modern identity flow into these legacy fields.
//
// `isConfigured` is the important addition: an empty user_roles array must be treated as
// "the user hasn't chosen yet," never silently coerced into "freelancer" or "hire talent."
// Callers that need a definite answer (dashboard, verify) should redirect to /profile/complete
// when !isConfigured rather than guessing.

export type RoleProfile = {
  user_roles?: string[] | null
  find_work_type?: string | null
  hire_talent_type?: string | null
  account_type?: string | null
}

export type RoleState = {
  isConfigured: boolean
  isFreelancer: boolean
  isJobSeeker: boolean
  isHireTalent: boolean
  isCompany: boolean
  findWorkType: string | null
  hireTalentType: string | null
}

export function resolveRoles(profile: RoleProfile | null | undefined): RoleState {
  const rawRoles = (profile?.user_roles as string[] | null) ?? []
  const findWorkType = profile?.find_work_type ?? null
  const hireTalentType = profile?.hire_talent_type ?? null

  const isFindWork = rawRoles.includes("find_work")
  const isHireTalent = rawRoles.includes("hire_talent")

  return {
    // Not just "array is non-empty": a handful of pre-migration-013 rows still carry
    // the old literal default value {"freelancer"}, which is neither "find_work" nor
    // "hire_talent". Treat those as unconfigured too, rather than letting them slip
    // past the redirect guards in dashboard/verify with neither role resolving true.
    isConfigured: isFindWork || isHireTalent,
    isFreelancer: isFindWork && findWorkType !== "job_seeker",
    isJobSeeker: isFindWork && (findWorkType === "job_seeker" || findWorkType === "both"),
    isHireTalent,
    // Matches dashboard.tsx's original formula exactly — hire_talent_type only.
    // account_type is read independently by the few call sites that need it
    // (app/verify, app/profile's org-creation nudge) since those already combine
    // it differently and this helper must not change their existing behavior.
    isCompany: isHireTalent && hireTalentType === "company",
    findWorkType,
    hireTalentType,
  }
}
