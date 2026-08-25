import { NextResponse } from "next/server"
import { requireSocialUser, canPostAsOrganization, socialDb } from "@/lib/social/server"

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params, db = socialDb(); const { data: share } = await db.from("marketplace_shares").select("id,actor_user_id,actor_organization_id").eq("id", id).maybeSingle()
  if (!share) return NextResponse.json({ success: true })
  const allowed = share.actor_user_id === user.id || (!!share.actor_organization_id && (await canPostAsOrganization(user.id, share.actor_organization_id)).allowed)
  if (!allowed) return NextResponse.json({ error: "Not authorized." }, { status: 403 })
  const { error } = await db.from("marketplace_shares").delete().eq("id", id); if (error) return NextResponse.json({ error: "Could not undo repost." }, { status: 503 }); return NextResponse.json({ success: true })
}
