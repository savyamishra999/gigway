import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

type Workplace = { id: string; name: string; username: string; logo_url: string | null }
export type WorkplaceMembership = Workplace & { role: string; canManage: boolean }

export async function activeWorkplaces(db: SupabaseClient, profileId: string): Promise<WorkplaceMembership[]> {
  const { data, error } = await db.from("organization_members")
    .select("member_role, organizations(id,name,username,logo_url)")
    .eq("profile_id", profileId).eq("status", "active")
  if (error) throw new Error("Your workplaces could not be loaded. Please try again.")
  return (data || []).flatMap(row => {
    const org = (Array.isArray(row.organizations) ? row.organizations[0] : row.organizations) as Workplace | null
    return org ? [{ ...org, role: row.member_role, canManage: ["owner", "admin"].includes(row.member_role) }] : []
  }).sort((a, b) => a.name.localeCompare(b.name))
}
