export type ProfessionalSignals = { skills?: string[] | null; location?: string | null; intents?: string[] }
export function professionalRelevance(viewer: ProfessionalSignals, person: ProfessionalSignals) {
  const normal = (s: string) => s.trim().toLocaleLowerCase()
  const skills = new Set((viewer.skills || []).map(normal).filter(Boolean))
  const shared = [...new Set((person.skills || []).filter(s => skills.has(normal(s))))]
  if (shared.length) return { score: 10 + Math.min(shared.length, 5), reason: `Shared skill: ${shared.slice(0, 2).join(", ")}` }
  const mine = viewer.intents || [], theirs = person.intents || []
  if (mine.includes("offering_services") && theirs.includes("hiring_talent")) return { score: 8, reason: "Interested in hiring talent" }
  if (mine.includes("hiring_talent") && theirs.includes("offering_services")) return { score: 8, reason: "Offers professional services" }
  if (mine.includes("looking_for_work") && theirs.includes("hiring_talent")) return { score: 7, reason: "Interested in hiring talent" }
  if (viewer.location?.trim() && normal(viewer.location) === normal(person.location || "")) return { score: 5, reason: `Also based in ${person.location?.trim()}` }
  if (mine.some(intent => theirs.includes(intent))) return { score: 2, reason: "Shares a professional interest" }
  return { score: 0, reason: "Explore this professional's work" }
}
