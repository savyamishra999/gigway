// Presentation + section-routing metadata for Work Intents (profile_intents).
//
// This is deliberately separate from lib/identity.ts, which stays untouched —
// mapModesToLegacyRoles() and the role bridge only need WORK_MODES' bare
// value/label, and nothing here should risk that compatibility surface.
//
// Adding a future intent (e.g. "Open to Partnerships") means: add it to
// WORK_MODES in lib/identity.ts, add one entry below with a `section` key,
// and — only if it needs its own dynamic fields — a new section component.
// The editor and profile views iterate this list; nothing else needs to change.

import { WORK_MODES, type WorkMode } from "@/lib/identity"

export type IntentSection = "freelance" | "fulltime" | "hiring"

export interface WorkIntentMeta {
  value: WorkMode
  label: string
  dot: string          // small status-dot color
  badgeClass: string   // pill badge classes for "What I'm Open To"
  section: IntentSection
}

const META: Record<WorkMode, WorkIntentMeta> = {
  offering_services: {
    value: "offering_services", label: "Freelance",
    dot: "bg-violet-400", badgeClass: "text-violet-300 bg-violet-400/10 border-violet-400/20",
    section: "freelance",
  },
  looking_for_work: {
    value: "looking_for_work", label: "Full-time",
    dot: "bg-blue-400", badgeClass: "text-blue-300 bg-blue-400/10 border-blue-400/20",
    section: "fulltime",
  },
  looking_for_project: {
    value: "looking_for_project", label: "Freelance Projects",
    dot: "bg-violet-400", badgeClass: "text-violet-300 bg-violet-400/10 border-violet-400/20",
    section: "freelance",
  },
  hiring_talent: {
    value: "hiring_talent", label: "Hiring",
    dot: "bg-orange-400", badgeClass: "text-orange-300 bg-orange-400/10 border-orange-400/20",
    section: "hiring",
  },
  grow_network: {
    value: "grow_network", label: "Network",
    dot: "bg-pink-400", badgeClass: "text-pink-300 bg-pink-400/10 border-pink-400/20",
    section: "freelance",
  },
}

export const WORK_INTENT_LIST: WorkIntentMeta[] = WORK_MODES.map(m => META[m.value])

export function intentMeta(value: WorkMode): WorkIntentMeta {
  return META[value]
}

export function activeSections(modes: WorkMode[]): Set<IntentSection> {
  return new Set(modes.map(m => META[m]?.section).filter((s): s is IntentSection => !!s))
}
