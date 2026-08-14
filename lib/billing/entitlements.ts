import type { SupabaseClient } from "@supabase/supabase-js"
import type { Product } from "./catalog"

export type UserEntitlements = { pro: boolean; business: boolean; verified: boolean; verificationPaid: boolean; tier: "free" | "pro" | "business"; expiresAt: string | null }
export async function getUserEntitlements(db: SupabaseClient, userId: string): Promise<UserEntitlements> {
  const now = new Date().toISOString()
  const [{ data }, { data: profile }] = await Promise.all([
    db.from("entitlements").select("tier,expires_at").eq("user_id", userId).eq("status", "active"),
    db.from("profiles").select("is_verified,verification_status").eq("id", userId).maybeSingle(),
  ])
  const active = (data || []).filter(e => e.tier === "verified" || (!!e.expires_at && e.expires_at > now))
  const business = active.some(e => e.tier === "business"); const pro = business || active.some(e => e.tier === "pro")
  const tier = business ? "business" : pro ? "pro" : "free"
  const expiresAt = active.filter(e => e.tier === tier && e.expires_at).map(e => e.expires_at as string).sort().at(-1) || null
  return { pro, business, verified: !!(profile?.is_verified || profile?.verification_status === "verified"), verificationPaid: active.some(e => e.tier === "verified"), tier, expiresAt }
}
export async function provisionProduct(db: SupabaseClient, args: { userId: string; product: Product; paymentId: string; orderId: string }) {
  const { data: already } = await db.from("entitlements").select("id").eq("razorpay_payment_id", args.paymentId).maybeSingle()
  if (already) return { already: true }
  const now = new Date(); let expiresAt: string | null = null
  if (args.product.durationDays) {
    const { data: current } = await db.from("entitlements").select("expires_at").eq("user_id", args.userId).eq("tier", args.product.tier).eq("status", "active").gt("expires_at", now.toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle()
    const start = current?.expires_at ? new Date(current.expires_at) : now
    expiresAt = new Date(start.getTime() + args.product.durationDays * 86400000).toISOString()
  }
  const { error: paymentError } = await db.from("payments").upsert({ user_id: args.userId, razorpay_order_id: args.orderId, razorpay_payment_id: args.paymentId, plan: args.product.key, amount: args.product.amountPaise / 100, status: "success", metadata: { product_key: args.product.key } }, { onConflict: "razorpay_payment_id" })
  if (paymentError) throw paymentError
  const { error } = await db.from("entitlements").insert({ user_id: args.userId, product_key: args.product.key, tier: args.product.tier, expires_at: expiresAt, razorpay_payment_id: args.paymentId })
  if (error) throw error
  if (args.product.tier === "verified") await db.from("profiles").update({ verification_paid_at: now.toISOString() }).eq("id", args.userId)
  await db.from("payment_orders").update({ status: "verified", razorpay_payment_id: args.paymentId, verified_at: now.toISOString() }).eq("razorpay_order_id", args.orderId)
  return { already: false, expiresAt }
}
