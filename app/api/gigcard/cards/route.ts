import { validateDesign } from "@/lib/gigcard/design"
import { normalizeCardPhoto } from "@/lib/gigcard/server-render"
import { GigCardError } from "@/lib/gigcard/payments"
import { cardModeOrThrow, cardDatabase, cardOwner, cardJson, cardErrorResponse, requireSameOrigin, ownedCard, saveOwnedCard } from "@/lib/gigcard/server"

export const runtime = "nodejs"
export async function GET(request: Request) {
  try {
    cardModeOrThrow()
    const db = cardDatabase(), owner = await cardOwner(db), id = new URL(request.url).searchParams.get("id")
    if (id) return Response.json({ card: await ownedCard(db, owner.id, id) }, { headers: { "Cache-Control": "no-store" } })
    const { data, error } = await db.from("gigcard_designs").select("id,revision,updated_at,title:design->details->>name").eq("owner_id", owner.id).order("updated_at", { ascending: false }).limit(20)
    if (error) throw new GigCardError("Saved cards are temporarily unavailable.", 503)
    return Response.json({ cards: data }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) { return cardErrorResponse(error) }
}
export async function POST(request: Request) {
  try {
    cardModeOrThrow(); requireSameOrigin(request)
    const db = cardDatabase(), owner = await cardOwner(db), body = await cardJson(request)
    let design
    try { design = validateDesign(body.design); design.photo = await normalizeCardPhoto(design.photo) }
    catch (error) { throw new GigCardError(error instanceof Error ? error.message : "Invalid card.") }
    const card = await saveOwnedCard(db, owner.id, body.card_id, body.revision, design)
    return Response.json({ card }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) { return cardErrorResponse(error) }
}
