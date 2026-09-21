export type ProfessionalIdentitySignals = {
  avatar_url?: string | null
  tagline?: string | null
  bio?: string | null
  skills?: string[] | null
  job_function?: string | string[] | null
  portfolio_links?: string[] | null
  experience_description?: string | null
  hasIntent?: boolean
}

export const PROFESSIONAL_MILESTONES = [
  { key: "photo", label: "Add profile photo", href: "/profile/edit?section=identity" },
  { key: "introduction", label: "Complete professional introduction", href: "/profile/edit?section=identity" },
  { key: "focus", label: "Add your professional focus or skills", href: "/profile/edit?section=professional" },
  { key: "evidence", label: "Add experience or portfolio", href: "/profile/edit?section=links" },
  { key: "intent", label: "Choose an opportunity intent", href: "/profile/edit?section=work" },
] as const

export function professionalMilestones(signals: ProfessionalIdentitySignals) {
  const functions = Array.isArray(signals.job_function) ? signals.job_function : signals.job_function ? [signals.job_function] : []
  const introduction = { ...PROFESSIONAL_MILESTONES[1], complete: !!signals.tagline?.trim() && !!signals.bio?.trim() }
  if (!signals.tagline?.trim()) Object.assign(introduction, { label: "Add professional headline", href: "/profile/edit?section=identity" })
  else if (!signals.bio?.trim()) Object.assign(introduction, { label: "Add About", href: "/profile/edit?section=about" })
  return [
    { ...PROFESSIONAL_MILESTONES[0], complete: !!signals.avatar_url },
    introduction,
    { ...PROFESSIONAL_MILESTONES[2], complete: functions.length > 0 || (signals.skills?.length ?? 0) > 0 },
    { ...PROFESSIONAL_MILESTONES[3], complete: !!signals.experience_description?.trim() || (signals.portfolio_links?.length ?? 0) > 0 },
    { ...PROFESSIONAL_MILESTONES[4], complete: !!signals.hasIntent },
  ]
}
