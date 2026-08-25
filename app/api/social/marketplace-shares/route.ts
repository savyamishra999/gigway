import { NextRequest, NextResponse } from "next/server"
import { canManageJob } from "@/lib/jobs/server"
import { canManageProject } from "@/lib/projects/server"
import { requireSocialUser, socialDb } from "@/lib/social/server"

const types = ["job", "project", "service"] as const
type ObjectType = typeof types[number]

export async function POST(req: NextRequest) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null), objectType = body?.objectType as ObjectType, objectId = body?.objectId
  if (!types.includes(objectType) || typeof objectId !== "string") return NextResponse.json({ error: "Invalid marketplace object." }, { status: 400 })
  const db = socialDb(); let object: any = null, owned = false, organizationId: string | null = null
  if (objectType === "job") { const r = await db.from("jobs").select("id,client_id,organization_id,status").eq("id", objectId).maybeSingle(); object = r.data; owned = !!object && await canManageJob(user.id, object) }
  if (objectType === "project") { const r = await db.from("projects").select("id,client_id,organization_id,status").eq("id", objectId).maybeSingle(); object = r.data; owned = !!object && await canManageProject(user.id, object) }
  if (objectType === "service") { const r = await db.from("gigs").select("id,freelancer_id,owner_id,status").eq("id", objectId).maybeSingle(); object = r.data; owned = !!object && (object.freelancer_id === user.id || object.owner_id === user.id) }
  if (!object || !["active", "open"].includes(object.status)) return NextResponse.json({ error: "This marketplace item is unavailable." }, { status: 404 })
  if (owned && object.organization_id) organizationId = object.organization_id
  const row: Record<string, string> = objectType === "job" ? { job_id: objectId } : objectType === "project" ? { project_id: objectId } : { service_id: objectId }
  if (organizationId) row.actor_organization_id = organizationId; else row.actor_user_id = user.id
  const { data, error } = await db.from("marketplace_shares").insert(row).select("id,created_at").single()
  if (error?.code === "23505") { const key = objectType === "job" ? "job_id" : objectType === "project" ? "project_id" : "service_id"; const actorKey = organizationId ? "actor_organization_id" : "actor_user_id"; const { data: existing } = await db.from("marketplace_shares").select("id,created_at").eq(key, objectId).eq(actorKey, organizationId || user.id).is("commentary", null).maybeSingle(); return NextResponse.json({ share: existing, existing: true }) }
  if (error || !data) return NextResponse.json({ error: "Could not share this item." }, { status: 503 })
  // Personal owners can receive a notification; entity recipients intentionally have no guessed admin.
  if (!owned && !object.organization_id) { const ownerId = objectType === "service" ? (object.freelancer_id || object.owner_id) : object.client_id; if (ownerId && ownerId !== user.id) { const { data: actor } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle(); void db.from("notifications").insert({ user_id: ownerId, type: "marketplace_repost", title: `Your ${objectType} was reposted`, body: `${actor?.full_name || "Someone"} reposted your ${objectType}`, link: `/${objectType === "service" ? "gigs" : `${objectType}s`}/${objectId}` }) } }
  return NextResponse.json({ share: data }, { status: 201 })
}
