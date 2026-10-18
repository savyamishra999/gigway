export const UTILITY_PRODUCTS = {
  resume_report: { label: "Full resume report + PDF", amount: 4900, days: null },
  pitch_pro: { label: "GigWay Pro — unlimited pitches", amount: 14900, days: 30 },
  professional_verified: { label: "GigWay Verified Professional", amount: 29900, days: 365 },
} as const
export type UtilityProduct = keyof typeof UTILITY_PRODUCTS
export function utilityProduct(value: unknown): UtilityProduct | null {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(UTILITY_PRODUCTS, value) ? value as UtilityProduct : null
}
export type ResumeReport = { overallScore: number; strengths: string[]; improvements: string[]; missingSections: string[]; skillsAnalysis: string[]; formatting: string[]; recommendedActions: string[] }
export type Pitch = { title: string; pitch: string; coverLetter: string }
export function validateReport(value: unknown): ResumeReport {
  const r = value as ResumeReport
  if (!r || !Number.isInteger(r.overallScore) || r.overallScore < 0 || r.overallScore > 100) throw Error("Invalid score")
  for (const key of ["strengths", "improvements", "missingSections", "skillsAnalysis", "formatting", "recommendedActions"] as const) {
    if (!Array.isArray(r[key]) || r[key].length > 8 || r[key].some(x => typeof x !== "string" || !x.trim() || x.length > 1600)) throw Error("Invalid report")
  }
  if (!r.strengths.length || !r.improvements.length || !r.recommendedActions.length) throw Error("Incomplete report")
  return r
}
export function validatePitch(value: unknown): Pitch {
  const r = value as Pitch
  if (!r || typeof r.title !== "string" || !r.title.trim() || r.title.length > 160 || typeof r.pitch !== "string" || r.pitch.trim().length < 40 || r.pitch.length > 4000 || typeof r.coverLetter !== "string" || r.coverLetter.trim().length < 100 || r.coverLetter.length > 10000) throw Error("Invalid pitch")
  return { title: r.title.trim(), pitch: r.pitch.trim(), coverLetter: r.coverLetter.trim() }
}
export function reportPreview(r: ResumeReport) { return { overallScore: r.overallScore, strengths: r.strengths.slice(0, 2), improvements: r.improvements.slice(0, 2) } }
