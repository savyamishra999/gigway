import { NextRequest, NextResponse } from "next/server";
import { POST_MEDIA_BUCKET, requireSocialUser, socialDb } from "@/lib/social/server";

const UUID = /^[0-9a-f-]{36}$/i;
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; if (!UUID.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data } = await socialDb().from("media_inspections").select("id,status,rejection_code,detected_container,detected_audio_codec,detected_duration_seconds,detected_size_bytes").eq("id", id).eq("uploader_user_id", user.id).eq("purpose", "jox_audio").maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const rejected = data.status === "rejected" ? (data.rejection_code === "duration_exceeded" ? "Jox can be up to 27 seconds." : data.rejection_code === "size_exceeded" ? "The file is too large." : ["invalid_container", "invalid_codec", "invalid_audio_streams"].includes(data.rejection_code || "") ? "This audio format isn’t supported." : "This audio can’t be used as a Jox.") : null;
  return NextResponse.json({ inspection: { id: data.id, status: data.status, durationSeconds: data.detected_duration_seconds, rejected } });
}
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; if (!UUID.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = socialDb(), path = `users/${user.id}/jox-temp/${id}/source.webm`;
  const removed = await db.from("media_inspections").delete().eq("id", id).eq("uploader_user_id", user.id).eq("purpose", "jox_audio").eq("status", "pending").select("id").maybeSingle();
  if (removed.error) return NextResponse.json({ error: "Could not cancel this Jox." }, { status: 503 });
  if (!removed.data) return NextResponse.json({ error: "This Jox is already being checked or is ready." }, { status: 409 });
  await db.storage.from(POST_MEDIA_BUCKET).remove([path]);
  return NextResponse.json({ success: true });
}
