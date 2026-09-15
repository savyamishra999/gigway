import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export const WORKPLACE_FIELDS = "id,name,username,logo_url,cover_url,tagline,description,website,industry,company_size,founded_year,location,country,entity_type,is_verified"
export const WORKPLACE_SECTIONS = ["home", "about", "people", "jobs", "projects", "content"] as const
export type WorkplaceSection = typeof WORKPLACE_SECTIONS[number]
export function workplaceSection(value?: string): WorkplaceSection {
  return WORKPLACE_SECTIONS.includes(value as WorkplaceSection) ? value as WorkplaceSection : "home"
}
export function workplacePage(value?: string) {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000) : 1
}
export function publicWorkplaceDb() {
  // No user session or service role: public panels cannot inherit admin access.
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
}
export function workplaceWebsite(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}
export type Person = { id: string; full_name: string | null; username: string; avatar_url: string | null; tagline: string | null; role: string }
export type Opportunity = { id: string; title: string; location?: string | null; job_type?: string | null; project_type?: string | null; category?: string | null; budget?: number | null; created_at: string; skills_required?: string[] | null }
export type PublicRows<T> = { items: T[]; hasMore: boolean; error: boolean }

// Count the same public profile eligibility used by the People cards, without
// downloading memberships. The inner join also respects profile RLS.
export async function workplacePeopleCount(db: SupabaseClient, id: string): Promise<number | null> {
  const { count, error } = await db.from("organization_members")
    .select("profile_id,person:profiles!profile_id!inner(id)", { count: "exact", head: true })
    .eq("organization_id", id).eq("status", "active")
    .not("person.username", "is", null)
    .or("is_private.eq.false,is_private.is.null", { referencedTable: "person" })
  // Unknown must not be presented as zero, matching the follower-count convention.
  return error ? null : count
}

export async function workplacePeople(db: SupabaseClient, id: string, size: number, page = 1): Promise<PublicRows<Person>> {
  const start = (page - 1) * size
  const result = await db.from("organization_members").select("profile_id,member_role")
    .eq("organization_id", id).eq("status", "active").order("profile_id").range(start, start + size)
  if (result.error) return { items: [], hasMore: false, error: true }
  const members = (result.data || []).slice(0, size)
  if (!members.length) return { items: [], hasMore: false, error: false }
  const profiles = await db.from("profiles").select("id,full_name,username,avatar_url,tagline")
    .in("id", members.map(row => row.profile_id)).not("username", "is", null)
    .or("is_private.eq.false,is_private.is.null")
  if (profiles.error) return { items: [], hasMore: false, error: true }
  const byId = new Map((profiles.data || []).map(profile => [profile.id, profile]))
  return { items: members.flatMap(member => { const person = byId.get(member.profile_id); return person ? [{ ...person, role: member.member_role }] : [] }), hasMore: (result.data || []).length > size, error: false }
}
export async function workplaceOpportunities(db: SupabaseClient, table: "jobs" | "projects", id: string, size: number, page = 1): Promise<PublicRows<Opportunity>> {
  const start = (page - 1) * size
  const fields = table === "jobs" ? "id,title,location,job_type,created_at,skills_required" : "id,title,category,project_type,budget,created_at,skills_required"
  const result = await db.from(table).select(fields).eq("organization_id", id)
    .eq("status", table === "jobs" ? "active" : "open").order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + size)
  return { items: (result.data || []).slice(0, size) as unknown as Opportunity[], hasMore: (result.data || []).length > size, error: !!result.error }
}
