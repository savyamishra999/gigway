import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueMediaInspection } from "@/lib/social/media-inspection-queue";
import { isValidJoxMedia, socialDb } from "@/lib/social/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(value => value.trim().toLowerCase());
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function admin() {
  const session = await createClient(), { data: { user } } = await session.auth.getUser();
  return user && ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") ? user : null;
}

function enabled() { return process.env.MEDIA_INSPECTION_E2E_TEST_ENABLED === "true"; }

export async function POST(request: NextRequest) {
  const user = await admin(); if (!enabled() || !user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.postId !== "string" || !UUID.test(body.postId)) return NextResponse.json({ error: "A valid test post is required." }, { status: 400 });
  const db = socialDb();
  const { data: post } = await db.from("posts").select("id,author_user_id,status,visibility").eq("id", body.postId).eq("author_user_id", user.id).maybeSingle();
  if (!post || post.status !== "published" || post.visibility !== "public") return NextResponse.json({ error: "Choose one of your public published Joxes." }, { status: 422 });
  const { data: media } = await db.from("post_media").select("id,media_type,mime_type,storage_path,duration_seconds,sort_order").eq("post_id", post.id).order("sort_order");
  const audio = (media || []).find(item => isValidJoxMedia(item.media_type, item.mime_type) && Number.isInteger(item.duration_seconds) && item.duration_seconds > 0 && item.duration_seconds <= 27);
  if (!audio) return NextResponse.json({ error: "This post has no eligible Jox audio." }, { status: 422 });
  const inspectionId = crypto.randomUUID(), storagePath = `users/${user.id}/jox-temp/${inspectionId}/source.webm`;
  const source = await db.storage.from("post-media").download(audio.storage_path);
  if (source.error || !source.data) return NextResponse.json({ error: "Could not load the trusted Jox source." }, { status: 503 });
  const bytes = Buffer.from(await source.data.arrayBuffer());
  const uploaded = await db.storage.from("post-media").upload(storagePath, bytes, { contentType: "audio/webm", upsert: false });
  if (uploaded.error) return NextResponse.json({ error: "Could not create the isolated inspection source." }, { status: 503 });
  const created = await db.from("media_inspections").insert({ id: inspectionId, uploader_user_id: user.id, bucket: "post-media", storage_path: storagePath, purpose: "jox_audio", status: "pending" });
  if (created.error) { await db.storage.from("post-media").remove([storagePath]); return NextResponse.json({ error: "Could not create the inspection." }, { status: 503 }); }
  try {
    const taskName = await enqueueMediaInspection({ inspectionId }, request);
    return NextResponse.json({ inspectionId, status: "pending", taskName }, { status: 201 });
  } catch {
    await Promise.all([db.storage.from("post-media").remove([storagePath]), db.from("media_inspections").delete().eq("id", inspectionId).eq("uploader_user_id", user.id)]);
    return NextResponse.json({ error: "Could not queue the inspection." }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const user = await admin(); if (!enabled() || !user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const id = request.nextUrl.searchParams.get("inspectionId"); if (!id || !UUID.test(id)) return NextResponse.json({ error: "A valid inspection is required." }, { status: 400 });
  const { data } = await socialDb().from("media_inspections").select("id,status,rejection_code,detected_container,detected_audio_codec,detected_duration_seconds,detected_size_bytes,created_at,completed_at").eq("id", id).eq("uploader_user_id", user.id).eq("purpose", "jox_audio").maybeSingle();
  return data ? NextResponse.json({ inspection: data }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const user = await admin(); if (!enabled() || !user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const id = request.nextUrl.searchParams.get("inspectionId"); if (!id || !UUID.test(id)) return NextResponse.json({ error: "A valid inspection is required." }, { status: 400 });
  const db = socialDb(), { data } = await db.from("media_inspections").select("id,bucket,storage_path,status").eq("id", id).eq("uploader_user_id", user.id).eq("purpose", "jox_audio").maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!["ready", "rejected", "failed"].includes(data.status)) return NextResponse.json({ error: "Wait for this inspection to finish before cleanup." }, { status: 409 });
  await Promise.all([db.storage.from(data.bucket).remove([data.storage_path]), db.from("media_inspections").delete().eq("id", data.id)]);
  return NextResponse.json({ success: true });
}
