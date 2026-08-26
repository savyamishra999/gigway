export type CanonicalIntent = "looking_for_work" | "looking_for_project" | "offering_services" | "hiring_talent" | "grow_network";
export type OpportunityKind = "job" | "project" | "service" | "course";
export type NetworkKind = "person" | "company" | "organization";

// Intent remains a small, explainable preference signal: base relevance and
// freshness always dominate. Selling services intentionally has no buyer-side
// service boost.
export const INTENT_BONUS = { opportunity: 12, network: 8, hiringPerson: 7, cap: 18 } as const;

export function intentBonus(kind: OpportunityKind, intents: ReadonlySet<string>) {
  if (kind === "job" && intents.has("looking_for_work")) return INTENT_BONUS.opportunity;
  if (kind === "project" && intents.has("looking_for_project")) return INTENT_BONUS.opportunity;
  return 0;
}

export function scoreIntentAwareOpportunity({ baseScore, kind, intents }: { baseScore: number; kind: OpportunityKind; intents: ReadonlySet<string> }) {
  const bonus = Math.min(intentBonus(kind, intents), INTENT_BONUS.cap);
  return { baseScore, intentBonus: bonus, finalScore: baseScore + bonus };
}

export function scoreNetworkCandidate({ baseScore, kind, intents, hasRelevantProfileSignal }: { baseScore: number; kind: NetworkKind; intents: ReadonlySet<string>; hasRelevantProfileSignal: boolean }) {
  const networkBonus = intents.has("grow_network") ? INTENT_BONUS.network : 0;
  const hiringBonus = kind === "person" && hasRelevantProfileSignal && intents.has("hiring_talent") ? INTENT_BONUS.hiringPerson : 0;
  const bonus = Math.min(networkBonus + hiringBonus, INTENT_BONUS.cap);
  return { baseScore, intentBonus: bonus, finalScore: baseScore + bonus };
}
