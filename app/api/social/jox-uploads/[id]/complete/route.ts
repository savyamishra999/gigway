import { NextRequest, NextResponse } from "next/server";
import { enqueueMediaInspection } from "@/lib/social/media-inspection-queue";
import { POST_MEDIA_BUCKET, requireSocialUser, socialDb } from "@/lib/social/server";

const UUID = /^[0-9a-f-]{36}$/i;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; if (!UUID.test(id)) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  const path = `users/${user.id}/jox-temp/${id}/source.webm`, db = socialDb();
  const { data: objects } = await db.storage.from(POST_MEDIA_BUCKET).list(`users/${user.id}/jox-temp/${id}`, { search: "source.webm" });
  const object = objects?.find(item => item.name === "source.webm");
  if (!object || Number(object.metadata?.size) < 1 || Number(object.metadata?.size) > 10 * 1024 * 1024 || object.metadata?.mimetype !== "audio/webm") return NextResponse.json({ error: "Your upload could not be checked." }, { status: 400 });
  const { error } = await db.from("media_inspections").insert({ id, uploader_user_id: user.id, bucket: POST_MEDIA_BUCKET, storage_path: path, purpose: "jox_audio", status: "pending" });
  if (error && error.code !== "23505") return NextResponse.json({ error: "Could not check your Jox." }, { status: 503 });
  try { await enqueueMediaInspection({ inspectionId: id }, request); } catch { return NextResponse.json({ error: "Could not start checking your Jox." }, { status: 503 }); }
  return NextResponse.json({ inspectionId: id, status: "pending" }, { status: 202 });
}
