export type MomentTheme = "rakhi";
export type MomentCta = { label: string; href: string };
export type Moment = {
  id: string; slug: string; name: string; occasionType: string; title: string; message: string;
  conversationPrompt: string; startAt: string; endAt: string; enabled: boolean;
  audience: { country?: string }; visualTheme: MomentTheme; primaryCTA: MomentCta; secondaryCTA: MomentCta; destination?: string;
};

// V1 is intentionally a typed local source. This resolver can later be replaced
// with Admin-backed data without changing Moment presentation components.
export const specialMoments: Moment[] = [{
  id: "raksha-bandhan-2026", slug: "raksha-bandhan", name: "Raksha Bandhan", occasionType: "festival",
  title: "Happy Raksha Bandhan", message: "Celebrating the people who always have your back.",
  conversationPrompt: "Who has always had your back?", startAt: "2026-08-27T18:30:00.000Z", endAt: "2026-08-29T18:29:59.999Z", enabled: true,
  audience: { country: "IN" }, visualTheme: "rakhi",
  primaryCTA: { label: "Share a GigThought", href: "/social/create?moment=raksha-bandhan" },
  secondaryCTA: { label: "Record a 27-sec VIJOX", href: "/social/create?moment=raksha-bandhan&mode=vijox" },
}];

export function getActiveMoment(now = new Date()): Moment | null {
  const preview = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_GIGWAY_MOMENT_PREVIEW === "1";
  return specialMoments.find((moment) => moment.enabled && (preview || (now >= new Date(moment.startAt) && now <= new Date(moment.endAt)))) || null;
}
