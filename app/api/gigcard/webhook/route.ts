import { GigCardError, settleCardPayment, type CardOrder } from "@/lib/gigcard/payments"
import { cardModeOrThrow, cardDatabase, cardGateway, cardStore, validHmac, cardErrorResponse } from "@/lib/gigcard/server"

export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    const mode = cardModeOrThrow(), secret = process.env.GIGCARD_RAZORPAY_WEBHOOK_SECRET
    if (!secret) throw new GigCardError("Webhook is not configured.", 503)
    if (Number(request.headers.get("content-length")) > 65536) throw new GigCardError("Webhook too large.", 413)
    const reader = request.body?.getReader(); if (!reader) throw new GigCardError("Missing webhook body.")
    const chunks: Uint8Array[] = []; let length = 0
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 65536) { await reader.cancel(); throw new GigCardError("Webhook too large.", 413) } chunks.push(value) }
    const raw = Buffer.concat(chunks).toString("utf8")
    if (!validHmac(raw, request.headers.get("x-razorpay-signature"), secret)) throw new GigCardError("Invalid webhook signature.")
    let event
    try { event = JSON.parse(raw) } catch { throw new GigCardError("Invalid webhook JSON.") }
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new GigCardError("Invalid webhook object.")
    if (!["payment.captured", "refund.processed"].includes(event.event)) return Response.json({ ok: true })
    const paymentId = event.event === "refund.processed" ? event.payload?.refund?.entity?.payment_id : event.payload?.payment?.entity?.id
    if (typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new GigCardError("Invalid payment reference.")
    const provider = cardGateway().provider, payment = await provider.getPayment(paymentId), db = cardDatabase()
    const { data, error } = await db.from("gigcard_orders").select("*").eq("razorpay_order_id", payment.order_id).maybeSingle()
    if (error) throw new GigCardError("Payment storage unavailable; retry webhook.", 503)
    if (!data) return Response.json({ ok: true, ignored: true })
    const order = data as CardOrder
    if (order.mode !== mode) throw new GigCardError("Payment mode mismatch.")
    await settleCardPayment(cardStore(db), provider, order, paymentId)
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) { return cardErrorResponse(error) }
}
