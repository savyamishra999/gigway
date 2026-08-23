import { socialDb } from "@/lib/social/server"

export async function canManageJob(userId: string, job: { client_id?: string | null; organization_id?: string | null }) {
  if (!job.organization_id) return job.client_id === userId
  const { data: profile } = await socialDb().from("profiles").select("id").eq("id", userId).maybeSingle()
  if (!profile) return false
  const { data: membership } = await socialDb().from("organization_members").select("member_role").eq("organization_id", job.organization_id).eq("profile_id", profile.id).eq("status", "active").maybeSingle()
  return !!membership && ["owner", "admin"].includes(membership.member_role)
}
