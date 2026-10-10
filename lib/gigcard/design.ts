import { CARD_ACCENTS, CARD_LIMITS, CARD_TEMPLATES, cardDestination, cleanCardDetails, type CardDetails, type CardTemplate } from "./model"

export type CardDesign = { details: CardDetails; template: CardTemplate; accent: string; showBrand: boolean; photo: string }
export type SavedCard = { id: string; design: CardDesign; revision: number; updated_at: string }
export function validateDesign(value: unknown): CardDesign {
  if (!value || typeof value !== "object") throw Error("Invalid card design.")
  const d = value as CardDesign
  if (!d.details || typeof d.details !== "object") throw Error("Invalid card details.")
  for (const [key, max] of Object.entries(CARD_LIMITS)) {
    const text = d.details[key as keyof CardDetails]
    if (typeof text !== "string" || text.length > max) throw Error(`Invalid ${key}.`)
  }
  const details = cleanCardDetails(d.details)
  if (!details.name) throw Error("Add a name to your card.")
  cardDestination("profile", details.website)
  if (!CARD_TEMPLATES.some(t => t.id === d.template) || !CARD_ACCENTS.some(a => a === d.accent) || typeof d.showBrand !== "boolean") throw Error("Invalid card style.")
  // Only normalized embedded PNGs are accepted. Never fetch client-supplied URLs on the server.
  if (typeof d.photo !== "string" || d.photo.length > 1_500_000 || (d.photo && !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(d.photo))) throw Error("Choose a smaller card photo.")
  return { details, template: d.template, accent: d.accent, showBrand: d.showBrand, photo: d.photo }
}
export function validCardId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
