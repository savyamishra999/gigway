import { GigCardError, prepareCardOrder, recoverCardPayment, settleCardPayment } from "@/lib/gigcard/payments"
import { paidCardImage } from "@/lib/gigcard/server-render"
import { cardModeOrThrow, cardDatabase, cardOwner, cardJson, cardErrorResponse, requireSameOrigin, ownedCard, ownedOrder, cardGateway, cardStore, validHmac } from "@/lib/gigcard/server"

export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    const mode = cardModeOrThrow(); requireSameOrigin(request)
    const db = cardDatabase(), owner = await cardOwner(db), body = await cardJson(request, 4096)
    const card = await ownedCard(db, owner.id, body.card_id)
    const gateway = cardGateway(), store = cardStore(db)
    if (body.operation === "create") {
      // Detect renderer/configuration failures before creating a chargeable order.
      await paidCardImage(card.design, owner.username, "png")
      const order = await prepareCardOrder(store, gateway.provider, card.id, owner.id, mode)
      return Response.json({ card_id: card.id, already_paid: order.status === "paid", order_id: order.razorpay_order_id, key_id: gateway.key, amount: order.amount_paise, currency: order.currency }, { headers: { "Cache-Control": "no-store" } })
    }
    const order = await ownedOrder(db, owner.id, card.id)
    if (!order || order.mode !== mode) throw new GigCardError("No matching card purchase was found.", 404)
    let result
    if (body.operation === "verify") {
      if (body.razorpay_order_id !== order.razorpay_order_id || typeof body.razorpay_payment_id !== "string" || !validHmac(`${order.razorpay_order_id}|${body.razorpay_payment_id}`, body.razorpay_signature, gateway.secret)) throw new GigCardError("Invalid payment signature.")
      result = await settleCardPayment(store, gateway.provider, order, body.razorpay_payment_id)
    } else if (body.operation === "restore") {
      // Recovers captured payments even when the browser success callback was lost.
      result = order.razorpay_order_id ? await recoverCardPayment(store, gateway.provider, order) : await prepareCardOrder(store, gateway.provider, card.id, owner.id, mode)
    } else throw new GigCardError("Unknown checkout action.")
    if (result.status !== "paid") throw new GigCardError(result.status === "refunded" ? "This card payment was refunded." : "Payment is not confirmed. Do not pay again while confirmation is pending.", 409)
    return Response.json({ verified: true, card_id: card.id }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) { return cardErrorResponse(error) }
}
