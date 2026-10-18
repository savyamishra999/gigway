import "server-only"
import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { getViewer } from "@/lib/auth/server"
import { cardJson, requireSameOrigin } from "@/lib/gigcard/server"
import { GigCardError } from "@/lib/gigcard/payments"
import { boundedFetch } from "@/lib/async"
export class UtilityError extends Error { constructor(message: string, public status = 400) { super(message) } }
export const utilityMode = (): "test" | "live" | "paused" => process.env.UTILITY_PAYMENTS_MODE === "live" ? "live" : process.env.UTILITY_PAYMENTS_MODE === "test" ? "test" : "paused"
export const accessMode = () => utilityMode() === "test" ? "test" : "live"
export function utilityDb() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new UtilityError("Tools are not configured yet.", 503)
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: boundedFetch } })
}
export type UtilityDb = ReturnType<typeof utilityDb>
export async function utilityOwner(db: UtilityDb) {
  const user = await getViewer()
  if (!user) throw new UtilityError("Please sign in to continue.", 401)
  const { data, error } = await db.from("profiles").select("id,username,full_name,is_banned").eq("id", user.id).maybeSingle()
  if (error) throw new UtilityError("Your account could not be checked.", 503)
  if (!data || !data.username || data.is_banned !== false) throw new UtilityError("Complete your profile or contact support to use these tools.", 403)
  return data as { id: string; username: string; full_name: string }
}
export async function utilityBody(req: Request) { requireSameOrigin(req); return cardJson(req, 100000) }
export const utilityJson = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } })
export function utilityError(error: unknown) {
  if (error instanceof UtilityError || error instanceof GigCardError) return utilityJson({ error: error.message }, error.status)
  return utilityJson({ error: "This action could not be completed. Please retry." }, 503)
}
export async function rpc(db: UtilityDb, name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args)
  if (error) {
    if (error.message.includes("PRO_REQUIRED")) throw new UtilityError("Your free pitch is used. Unlock GigWay Pro to create more.", 402)
    for (const message of ["Generation in progress", "Please wait before generating again", "Three free previews per day.", "Review must be approved before payment", "Report not found", "Pitch not found"]) if (error.message.includes(message)) throw new UtilityError(error.message, 409)
    throw new UtilityError("Tool storage is unavailable. Please retry later.", 503)
  }
  return data
}
export function uuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) }
export async function ownedDocument(db: UtilityDb, owner: string, id: unknown) {
  if (!uuid(id)) throw new UtilityError("Invalid document.", 400)
  const { data, error } = await db.from("utility_documents").select("*").eq("id", id).eq("owner_id", owner).eq("status", "ready").maybeSingle()
  if (error) throw new UtilityError("Documents are unavailable.", 503)
  if (!data) throw new UtilityError("Document not found.", 404)
  return data
}
export async function paidAccess(db: UtilityDb, owner: string, product: string, document?: string) {
  let q = db.from("utility_orders").select("id,expires_at").eq("owner_id", owner).eq("product", product).eq("mode", accessMode()).eq("status", "paid")
  q = document ? q.eq("document_id", document) : q.gt("expires_at", new Date().toISOString())
  const { data, error } = await q.limit(1).maybeSingle()
  if (error) throw new UtilityError("Purchase access could not be checked.", 503)
  return data
}
export function validSignature(message: string, signature: unknown, secret: string) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false
  return crypto.timingSafeEqual(crypto.createHmac("sha256", secret).update(message).digest(), Buffer.from(signature, "hex"))
}
