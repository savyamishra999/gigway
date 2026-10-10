export const CARD_TEMPLATES = [
  { id: "noir", name: "Midnight", description: "Confident. Minimal. Memorable.", background: "#101321", foreground: "#ffffff" },
  { id: "studio", name: "Studio", description: "Warm paper, clean typography.", background: "#faf7f0", foreground: "#17243a" },
  { id: "prism", name: "Prism", description: "Bright ideas deserve colour.", background: "#382ba3", foreground: "#ffffff" },
] as const
export type CardTemplate = typeof CARD_TEMPLATES[number]["id"]
export const CARD_ACCENTS = ["#8b7cff", "#22c7b8", "#ffb45b"] as const
export type CardDetails = { name: string; headline: string; skills: string; location: string; email: string; phone: string; company: string; website: string }
export type CardProfile = { full_name: string | null; username: string; avatar_url: string | null; tagline: string | null; skills: string[] | null; location: string | null }
export function initialCardDetails(profile: CardProfile): CardDetails {
  return { name: profile.full_name || "", headline: profile.tagline || "", skills: (profile.skills || []).slice(0, 4).join(" · "), location: profile.location || "", email: "", phone: "", company: "", website: "" }
}
export const CARD_LIMITS: Record<keyof CardDetails, number> = { name: 70, headline: 110, skills: 100, location: 60, email: 80, phone: 30, company: 60, website: 160 }
export function cleanCardDetails(details: CardDetails): CardDetails {
  return Object.fromEntries(Object.entries(CARD_LIMITS).map(([key, max]) => [key, String(details[key as keyof CardDetails] || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max)])) as CardDetails
}
export function cardProfileUrl(username: string) { return `https://www.gigway.in/u/${encodeURIComponent(username)}` }

export function cardDestination(username: string, website = "") {
  if (!website.trim()) return cardProfileUrl(username)
  try {
    const url = new URL(website.trim())
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) throw Error()
    return url.href
  } catch { throw Error("Enter a complete HTTPS website address, such as https://yourcompany.com, or leave it blank.") }
}
