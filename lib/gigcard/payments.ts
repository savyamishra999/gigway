import { GIGCARD_PRICE_PAISE } from "./purchase"

export class GigCardError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export type CardOrder = {
  id: string; card_id: string; owner_id: string; mode: "test" | "live";
  amount_paise: number; currency: string; status: "creating" | "created" | "paid" | "refunded";
  razorpay_order_id: string | null; razorpay_payment_id: string | null; new_order?: boolean;
}
export interface PaymentStore {
  reserve(card: string, owner: string, mode: "test" | "live"): Promise<CardOrder>
  attach(id: string, owner: string, providerId: string): Promise<CardOrder>
  settle(order: CardOrder, paymentId: string, refunded: boolean): Promise<CardOrder>
}
export interface CardProvider {
  createOrder(data: { amount: number; currency: string; receipt: string; notes: Record<string, string> }): Promise<any>
  findOrders(receipt: string): Promise<any[]>
  getOrder(id: string): Promise<any>
  getPayment(id: string): Promise<any>
  getOrderPayments(id: string): Promise<any[]>
}
const receiptFor = (order: CardOrder) => `gc_${order.id.replace(/-/g, "")}`
export function assertProviderOrder(local: CardOrder, remote: any) {
  if (!remote || remote.amount !== GIGCARD_PRICE_PAISE || remote.currency !== "INR" || remote.receipt !== receiptFor(local) || remote.notes?.gigcard_order !== local.id || remote.notes?.owner_id !== local.owner_id || remote.notes?.card_id !== local.card_id || !/^order_[A-Za-z0-9]+$/.test(remote.id || "") || (local.razorpay_order_id && remote.id !== local.razorpay_order_id)) throw new GigCardError("Payment order could not be validated.", 409)
}
export async function settleCardPayment(store: PaymentStore, provider: CardProvider, order: CardOrder, paymentId: string) {
  if (!order.razorpay_order_id || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new GigCardError("Invalid payment reference.")
  const [remote, payment] = await Promise.all([provider.getOrder(order.razorpay_order_id), provider.getPayment(paymentId)])
  assertProviderOrder(order, remote)
  if (payment.id !== paymentId || payment.order_id !== order.razorpay_order_id || payment.amount !== GIGCARD_PRICE_PAISE || payment.currency !== "INR" || !["captured", "refunded"].includes(payment.status) || typeof payment.amount_refunded !== "number" || payment.amount_refunded < 0 || payment.amount_refunded > payment.amount) throw new GigCardError("Payment confirmation is pending. Do not pay again.", 409)
  return store.settle(order, payment.id, payment.status === "refunded" || payment.amount_refunded > 0)
}
export async function recoverCardPayment(store: PaymentStore, provider: CardProvider, order: CardOrder) {
  if (!order.razorpay_order_id) return order
  if (order.razorpay_payment_id) return settleCardPayment(store, provider, order, order.razorpay_payment_id)
  const remote = await provider.getOrder(order.razorpay_order_id)
  assertProviderOrder(order, remote)
  if (remote.status !== "paid") return order
  const payments = await provider.getOrderPayments(order.razorpay_order_id)
  const paid = payments.filter(p => ["captured", "refunded"].includes(p.status))
  if (paid.length !== 1) throw new GigCardError("Payment is being reconciled. Do not pay again.", 409)
  return settleCardPayment(store, provider, order, paid[0].id)
}
export async function prepareCardOrder(store: PaymentStore, provider: CardProvider, cardId: string, ownerId: string, mode: "test" | "live") {
  let order = await store.reserve(cardId, ownerId, mode)
  if (order.owner_id !== ownerId || order.card_id !== cardId || order.mode !== mode || order.amount_paise !== GIGCARD_PRICE_PAISE || order.currency !== "INR") throw new GigCardError("Invalid card order.", 409)
  if (!order.razorpay_order_id) {
    let remote
    if (order.new_order) {
      // Reservation exists before external I/O. After an uncertain network result
      // we recover by receipt, never create a second order for this card.
      remote = await provider.createOrder({ amount: GIGCARD_PRICE_PAISE, currency: "INR", receipt: receiptFor(order), notes: { gigcard_order: order.id, card_id: cardId, owner_id: ownerId, product_key: "gigcard_v1" } })
    } else {
      const matches = await provider.findOrders(receiptFor(order))
      if (matches.length !== 1) throw new GigCardError("Your payment order is being confirmed. Please retry later; do not make another payment.", 409)
      remote = matches[0]
    }
    assertProviderOrder(order, remote)
    order = await store.attach(order.id, ownerId, remote.id)
  }
  order = await recoverCardPayment(store, provider, order)
  if (order.status === "refunded") throw new GigCardError("Payment access has been revoked. Contact support before purchasing again.", 403)
  return order
}
