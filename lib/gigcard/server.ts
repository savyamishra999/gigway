import "server-only"
import crypto from "node:crypto"
import Razorpay from "razorpay"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getViewer } from "@/lib/auth/server"
import { boundedFetch } from "@/lib/async"
import { gigcardMode } from "./config"
import { GigCardError, type CardOrder, type CardProvider, type PaymentStore } from "./payments"
import { validCardId, type CardDesign, type SavedCard } from "./design"

export function cardModeOrThrow() {
  const mode = gigcardMode()
  if (mode === "paused") throw new GigCardError("GigCard checkout is not open yet. No payment was taken. You can keep editing your preview.", 503)
  return mode
}
export function cardDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new GigCardError("Card storage is not configured.", 503)
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: boundedFetch } })
}
export type CardDB = ReturnType<typeof cardDatabase>
export async function cardOwner(db: CardDB) {
  const user = await getViewer()
  if (!user) throw new GigCardError("Log in to access your cards.", 401)
  const { data, error } = await db.from("profiles").select("username,is_banned").eq("id", user.id).maybeSingle()
  if (error || !data) throw new GigCardError("Your account could not be checked.", 503)
  if (data.is_banned !== false || !data.username) throw new GigCardError("Your account cannot purchase or export cards.", 403)
  return { id: user.id, username: data.username as string }
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin || origin !== new URL(request.url).origin) throw new GigCardError("Invalid request origin.", 403)
}
export async function cardJson(request: Request, limit = 2_000_000) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new GigCardError("JSON required.", 415)
  if (Number(request.headers.get("content-length")) > limit) throw new GigCardError("Card photo is too large.", 413)
  const reader = request.body?.getReader()
  if (!reader) throw new GigCardError("Missing request body.")
  const chunks: Uint8Array[] = []; let size = 0
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    size += value.byteLength
    if (size > limit) { await reader.cancel(); throw new GigCardError("Card photo is too large.", 413) }
    chunks.push(value)
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Object required")
    return value as Record<string, unknown>
  }
  catch { throw new GigCardError("Invalid JSON.") }
}
function dbError(error: { code?: string } | null) {
  if (!error) return
  if (error.code === "42501") throw new GigCardError("Card not found.", 404)
  if (["40001", "23505", "22023"].includes(error.code || "")) throw new GigCardError("Card or payment changed. Reload and try again.", 409)
  if (error.code === "54000") throw new GigCardError("You have reached the saved-card limit.", 409)
  throw new GigCardError("Card storage is temporarily unavailable. No payment should be retried until it recovers.", 503)
}
export function cardStore(db: CardDB): PaymentStore {
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args); dbError(error)
    if (!data) throw new GigCardError("Payment record unavailable.", 503)
    return data as CardOrder
  }
  return {
    reserve: (card, owner, mode) => rpc("gigcard_reserve_order", { p_card: card, p_owner: owner, p_mode: mode }),
    attach: (id, owner, providerId) => rpc("gigcard_attach_order", { p_id: id, p_owner: owner, p_provider_order: providerId }),
    settle: (order, paymentId, refunded) => rpc("gigcard_settle", { p_id: order.id, p_order: order.razorpay_order_id, p_payment: paymentId, p_amount: order.amount_paise, p_currency: order.currency, p_refunded: refunded }),
  }
}
export async function ownedCard(db: CardDB, owner: string, id: unknown): Promise<SavedCard> {
  if (!validCardId(id)) throw new GigCardError("Invalid card ID.")
  const { data, error } = await db.from("gigcard_designs").select("id,design,revision,updated_at").eq("id", id).eq("owner_id", owner).maybeSingle()
  dbError(error); if (!data) throw new GigCardError("Card not found.", 404)
  return data as SavedCard
}
export async function saveOwnedCard(db: CardDB, owner: string, id: unknown, revision: unknown, design: CardDesign): Promise<SavedCard> {
  if (!validCardId(id) || !Number.isSafeInteger(revision) || (revision as number) < 0) throw new GigCardError("Invalid card version.")
  const { data, error } = await db.rpc("gigcard_save", { p_id: id, p_owner: owner, p_revision: revision, p_design: design }); dbError(error)
  return { id: data.id, revision: data.revision, design: data.design, updated_at: data.updated_at }
}
export async function ownedOrder(db: CardDB, owner: string, cardId: string) {
  const { data, error } = await db.from("gigcard_orders").select("*").eq("card_id", cardId).eq("owner_id", owner).maybeSingle()
  dbError(error); return data as CardOrder | null
}
export function cardGateway() {
  const mode = cardModeOrThrow(), key = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET
  if (!key?.startsWith(`rzp_${mode}_`) || !secret) throw new GigCardError("Card payment keys do not match the payment mode.", 503)
  const sdk = new Razorpay({ key_id: key, key_secret: secret })
  const provider: CardProvider = {
    createOrder: data => sdk.orders.create(data),
    findOrders: async receipt => (await sdk.orders.all({ receipt, count: 100 })).items,
    getOrder: id => sdk.orders.fetch(id),
    getPayment: id => sdk.payments.fetch(id),
    getOrderPayments: async id => (await sdk.orders.fetchPayments(id)).items,
  }
  return { key, secret, provider, mode }
}
export function validHmac(message: string, supplied: unknown, secret: string) {
  if (typeof supplied !== "string" || !/^[a-f0-9]{64}$/i.test(supplied)) return false
  const expected = crypto.createHmac("sha256", secret).update(message).digest()
  return crypto.timingSafeEqual(expected, Buffer.from(supplied, "hex"))
}
export function cardErrorResponse(error: unknown) {
  const known = error instanceof GigCardError
  return Response.json({ error: known ? error.message : "Card processing failed. If you paid, do not pay again; use Restore purchase or contact support." }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } })
}
