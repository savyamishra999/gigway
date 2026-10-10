import { GIGCARD_PRICE_PAISE, type CardAction } from "./purchase"

type Receipt = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayInstance = { open(): void; on(event: string, handler: () => void): void }
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance
type CheckoutWindow = Window & { Razorpay?: RazorpayConstructor }
let scriptLoad: Promise<void> | null = null

async function loadCheckout() {
  if ((window as CheckoutWindow).Razorpay) return
  if (!scriptLoad) scriptLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    const timer = window.setTimeout(() => { script.remove(); scriptLoad = null; reject(Error("Razorpay could not load. Please retry.")) }, 15000)
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => { clearTimeout(timer); resolve() }
    script.onerror = () => { clearTimeout(timer); script.remove(); scriptLoad = null; reject(Error("Razorpay could not load. Please retry.")) }
    document.body.appendChild(script)
  })
  await scriptLoad
  if (!(window as CheckoutWindow).Razorpay) { scriptLoad = null; throw Error("Razorpay is unavailable. Please retry.") }
}

async function request(body: Record<string, unknown>) {
  const response = await fetch("/api/gigcard/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw Error(result.error || "Checkout is unavailable. Please retry.")
  return result
}

// The server owns both the saved card and its purchase. A verified callback is
// followed by a separately authorized server export, never a local paid flag.
export async function beginCardCheckout(action: CardAction, cardId: string): Promise<"cancelled" | "verified"> {
  const order = await request({ operation: "create", action, card_id: cardId })
  if (order.card_id !== cardId) throw Error("Checkout card mismatch.")
  if (order.already_paid === true) return "verified"
  if (typeof order.order_id !== "string" || !order.order_id.startsWith("order_") || typeof order.key_id !== "string" || !order.key_id.startsWith("rzp_") || order.amount !== GIGCARD_PRICE_PAISE || order.currency !== "INR" || typeof order.card_id !== "string" || !order.card_id) throw Error("Checkout is not ready. No payment was started.")
  await loadCheckout()
  const Checkout = (window as CheckoutWindow).Razorpay!
  return new Promise((resolve, reject) => {
    let verifying = false, settled = false
    const fail = (error: Error) => { if (!settled) { settled = true; reject(error) } }
    const checkout = new Checkout({
      key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
      name: "GigWay", description: "One GigCard · one-time purchase",
      handler: async (receipt: Receipt) => {
        if (verifying || settled) return
        verifying = true
        try {
          if (receipt.razorpay_order_id !== order.order_id) throw Error("Payment order mismatch. Your card remains locked.")
          const verification = await request({ operation: "verify", card_id: order.card_id, ...receipt })
          if (verification.verified !== true || verification.card_id !== order.card_id) throw Error("Payment confirmation is pending. Please do not pay again.")
          settled = true; resolve("verified")
        } catch { fail(Error("Payment confirmation is pending. Please do not pay again; contact support with your payment receipt.")) }
      },
      modal: { ondismiss: () => { if (!verifying && !settled) { settled = true; resolve("cancelled") } } },
      theme: { color: "#4f46e5" },
    })
    checkout.on("payment.failed", () => fail(Error("Payment failed. Your card remains locked.")))
    checkout.open()
  })
}

export async function restoreCardPurchase(cardId: string) {
  const result = await request({ operation: "restore", card_id: cardId })
  if (result.verified !== true || result.card_id !== cardId) throw Error("No confirmed purchase was found. If you paid, do not pay again; contact support.")
}

export async function fetchPaidCard(cardId: string, action: CardAction) {
  const format = action === "share" ? "png" : action
  const response = await fetch("/api/gigcard/export", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ card_id: cardId, format }) })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw Error(data.error || "Export could not be delivered. Do not pay again; retry or restore your purchase.") }
  const type = format === "pdf" ? "application/pdf" : format === "jpeg" ? "image/jpeg" : "image/png"
  if (response.headers.get("content-type") !== type) throw Error("Invalid export response. Do not pay again.")
  const blob = await response.blob()
  return new File([blob], `gigcard-${cardId}.${format === "jpeg" ? "jpg" : format}`, { type })
}
