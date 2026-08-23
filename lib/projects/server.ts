import { socialDb } from "@/lib/social/server"

export async function canManageProject(userId: string, project: { client_id?: string | null; organization_id?: string | null }) {
  if (!project.organization_id) return project.client_id === userId
  const { data: membership } = await socialDb().from("organization_members").select("member_role").eq("organization_id", project.organization_id).eq("profile_id", userId).eq("status", "active").maybeSingle()
  return !!membership && ["owner", "admin"].includes(membership.member_role)
}
