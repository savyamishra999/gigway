import "server-only";
import { createClient } from "@/lib/supabase/server";

export const WORK_PREVIEW_LIMIT = 6;
export type WorkKind = "jobs" | "projects" | "services";
export type WorkPreview = {
  id: string; title: string; author?: string | null; detail?: string | null;
  amount?: number | null; createdAt?: string | null; updatedAt?: string | null;
};
type Name = { full_name?: string | null; name?: string | null };
const nameOf = (value: Name | Name[] | null | undefined) => {
  const person = Array.isArray(value) ? value[0] : value;
  return person?.name || person?.full_name;
};
export async function workPreviews(kind: WorkKind, limit: 2 | 6 = WORK_PREVIEW_LIMIT): Promise<{ items: WorkPreview[]; unavailable: boolean }> {
  try {
    // Same session/anon client and published statuses as existing listings; RLS applies.
    const db = await createClient();
    const query = kind === "jobs"
      ? db.from("jobs").select("id,title,company_name,location,job_type,created_at,poster:client_id(full_name),workplace:organization_id(name)").eq("status", "active")
      : kind === "projects"
        ? db.from("projects").select("id,title,budget,category,created_at,poster:client_id(full_name),workplace:organization_id(name)").eq("status", "open")
        // Existing service detail uses a whole row. Include updated_at when present
        // without requiring a new column where only created_at is stored.
        : db.from("gigs").select("*,provider:owner_id(full_name),professional:freelancer_id(full_name)").eq("status", "active");
    const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
    if (error) throw error;
    const items = (data || []).slice(0, limit).map((row: any): WorkPreview => ({
      id: row.id, title: row.title,
      author: kind === "services" ? nameOf(row.provider) || nameOf(row.professional) : nameOf(row.workplace) || row.company_name || nameOf(row.poster),
      detail: kind === "jobs" ? [row.location, row.job_type].filter(Boolean).join(" · ") : row.category,
      amount: kind === "jobs" ? null : kind === "projects" ? row.budget : row.price,
      createdAt: row.created_at, updatedAt: kind === "services" ? row.updated_at : undefined,
    }));
    return { items, unavailable: false };
  } catch { return { items: [], unavailable: true }; }
}
