import type { SupabaseClient } from "@supabase/supabase-js"
import { getUserEntitlements } from "./entitlements"
export type LimitKey = "applications" | "proposals" | "gigs" | "portfolio" | "saved" | "jobs" | "projects" | "resume_analyses" | "opportunity_matches" | "profile_intelligence" | "job_description_analyses" | "career_gap_analyses" | "smart_applications" | "smart_proposals"
const LIMITS: Record<LimitKey, { free: number; pro?: number; business?: number; monthly?: boolean }> = {
  applications: { free: 2, pro: 50, monthly: true }, proposals: { free: 1, pro: 30, monthly: true }, gigs: { free: 1, pro: 10 }, portfolio: { free: 2, pro: 20 }, saved: { free: 3, pro: Infinity }, jobs: { free: 1, business: 10 }, projects: { free: 1, business: 10 }, resume_analyses: { free: 1, pro: 10, monthly: true }, opportunity_matches: { free: 1, pro: 10, monthly: true }, profile_intelligence: { free: 1, pro: 10, monthly: true }, job_description_analyses: { free: 1, pro: 10, monthly: true }, career_gap_analyses: { free: 1, pro: 10, monthly: true }, smart_applications: { free: 1, pro: 10, monthly: true }, smart_proposals: { free: 1, pro: 10, monthly: true },
}
const monthStart = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
export async function getUsageLimit(db: SupabaseClient, userId: string, key: LimitKey) {
  const entitlements = await getUserEntitlements(db, userId); const rule = LIMITS[key]
  const limit = rule.business && entitlements.business ? rule.business : rule.pro && entitlements.pro ? rule.pro : rule.free
  let used = 0
  if (key === "applications") { const { count } = await db.from("job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "proposals") { const { count } = await db.from("proposals").select("id", { count: "exact", head: true }).eq("freelancer_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "gigs") { const { count } = await db.from("gigs").select("id", { count: "exact", head: true }).or(`owner_id.eq.${userId},freelancer_id.eq.${userId}`).eq("status", "active"); used = count || 0 }
  if (key === "saved") { const { count } = await db.from("saved_items").select("id", { count: "exact", head: true }).eq("user_id", userId); used = count || 0 }
  if (key === "jobs") { const { count } = await db.from("jobs").select("id", { count: "exact", head: true }).eq("client_id", userId).eq("status", "active"); used = count || 0 }
  if (key === "projects") { const { count } = await db.from("projects").select("id", { count: "exact", head: true }).eq("client_id", userId).eq("status", "open"); used = count || 0 }
  if (key === "portfolio") { const { data } = await db.from("profiles").select("portfolio_links").eq("id", userId).maybeSingle(); used = (data?.portfolio_links as string[] | null)?.length || 0 }
  if (key === "resume_analyses") { const { count } = await db.from("resume_analyses").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "opportunity_matches") { const { count } = await db.from("opportunity_matches").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "profile_intelligence") { const { count } = await db.from("profile_intelligence_analyses").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "job_description_analyses") { const { count } = await db.from("job_description_analyses").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "career_gap_analyses") { const { count } = await db.from("career_gap_analyses").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "smart_applications") { const { count } = await db.from("smart_applications").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  if (key === "smart_proposals") { const { count } = await db.from("smart_proposals").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart()); used = count || 0 }
  return { key, used, limit, remaining: limit === Infinity ? Infinity : Math.max(0, limit - used), allowed: used < limit, tier: entitlements.tier }
}
export function limitResponse(usage: Awaited<ReturnType<typeof getUsageLimit>>) { return { error: "upgrade_required", message: `You've used ${usage.used} of ${usage.limit === Infinity ? "unlimited" : usage.limit} available ${usage.key}.`, usage } }
