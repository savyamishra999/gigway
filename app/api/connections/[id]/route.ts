import { NextRequest, NextResponse } from "next/server";
import { connectionRow, resolveConnectionState } from "@/lib/connections/server";
import { requireSocialUser, resolveProfile, socialDb } from "@/lib/social/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: profileId } = await params; if (user.id === profileId) return NextResponse.json({ error: "You cannot connect with yourself." }, { status: 400 });
  if (!await resolveProfile(profileId)) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const db = socialDb(); const existing = await connectionRow(user.id, profileId);
  if (existing?.status === "accepted") return NextResponse.json({ state: "connected" });
  if (existing?.status === "pending") return NextResponse.json({ state: await resolveConnectionState(user.id, profileId), error: existing.requester_user_id === user.id ? undefined : "This professional has already sent you a request." }, { status: existing.requester_user_id === user.id ? 200 : 409 });
  const payload = { requester_user_id: user.id, recipient_user_id: profileId, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), responded_at: null };
  const result = existing ? await db.from("professional_connections").update(payload).eq("id", existing.id) : await db.from("professional_connections").insert(payload);
  if (result.error) return NextResponse.json({ error: "Could not send connection request." }, { status: 409 });
  const actor = await resolveProfile(user.id); await db.from("notifications").insert({ user_id: profileId, type: "connection_request", title: "New connection request", body: `${actor?.full_name || "Someone"} wants to connect with you`, link: "/network" });
  return NextResponse.json({ state: "outgoing_pending" }, { status: 201 });
}
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { id: profileId } = await params; const row = await connectionRow(user.id, profileId);
  if (!row || (row.status === "pending" && row.requester_user_id !== user.id)) return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  const { error } = await socialDb().from("professional_connections").update({ status: "cancelled", updated_at: new Date().toISOString(), responded_at: new Date().toISOString() }).eq("id", row.id); if (error) return NextResponse.json({ error: "Could not update connection." }, { status: 503 }); return NextResponse.json({ state: "none" });
}
