import { GigCardError, recoverCardPayment } from "@/lib/gigcard/payments"
import { paidCardImage } from "@/lib/gigcard/server-render"
import { cardModeOrThrow, cardDatabase, cardOwner, cardJson, cardErrorResponse, requireSameOrigin, ownedCard, ownedOrder, cardGateway, cardStore } from "@/lib/gigcard/server"

export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    const mode = cardModeOrThrow(); requireSameOrigin(request)
    const db = cardDatabase(), owner = await cardOwner(db), body = await cardJson(request, 4096)
    if (!["png", "jpeg", "pdf"].includes(body.format as string)) throw new GigCardError("Invalid export format.")
    const card = await ownedCard(db, owner.id, body.card_id), order = await ownedOrder(db, owner.id, card.id)
    if (!order || order.mode !== mode) throw new GigCardError("Purchase this card before downloading or sharing it.", 402)
    // No browser receipt or paid flag grants access. Recheck provider state so
    // refunds revoke exports even if a webhook delivery was missed.
    const verified = await recoverCardPayment(cardStore(db), cardGateway().provider, order)
    if (verified.status !== "paid") throw new GigCardError("An active paid purchase is required for this card.", 402)
    const image = await paidCardImage(card.design, owner.username, body.format as "png" | "jpeg" | "pdf")
    return new Response(new Uint8Array(image.bytes), { headers: {
      "Content-Type": image.type, "Content-Disposition": `attachment; filename="gigcard-${card.id}.${image.extension}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } })
  } catch (error) { return cardErrorResponse(error) }
}
