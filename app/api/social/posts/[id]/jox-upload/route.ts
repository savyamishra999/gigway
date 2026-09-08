import { NextRequest, NextResponse } from "next/server";
import { canManagePost, isValidJoxMedia, POST_MEDIA_BUCKET, requireSocialUser, socialDb, updatePostType } from "@/lib/social/server";
import { allowsMediaComposition, isJox } from "@/lib/social/content-domain";

const UUID = /^[0-9a-f-]{36}$/i;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params, body = await request.json().catch(() => ({})), inspectionId = body.inspectionId;
  if (!UUID.test(postId) || typeof inspectionId !== "string" || !UUID.test(inspectionId)) return NextResponse.json({ error: "Invalid Jox upload." }, { status: 400 });
  const db = socialDb(), { data: post } = await db.from("posts").select("id,author_user_id,author_organization_id,status,content_format").eq("id", postId).maybeSingle();
  if (!post || post.status !== "hidden" || !isJox(post.content_format) || !await canManagePost(post, user.id)) return NextResponse.json({ error: "Jox draft not found." }, { status: 404 });
  const path = `users/${user.id}/jox-temp/${inspectionId}/source.webm`, { data: inspection } = await db.from("media_inspections").select("id,status,bucket,storage_path,detected_duration_seconds,detected_size_bytes,detected_container,detected_audio_codec").eq("id", inspectionId).eq("uploader_user_id", user.id).eq("purpose", "jox_audio").maybeSingle();
  if (!inspection || inspection.status !== "ready" || inspection.bucket !== POST_MEDIA_BUCKET || inspection.storage_path !== path || inspection.detected_container !== "webm" || inspection.detected_audio_codec !== "opus" || !Number.isFinite(inspection.detected_duration_seconds) || inspection.detected_duration_seconds <= 0 || inspection.detected_duration_seconds > 27 || !Number.isFinite(inspection.detected_size_bytes) || inspection.detected_size_bytes < 1 || inspection.detected_size_bytes > 10 * 1024 * 1024) return NextResponse.json({ error: "Your Jox is not ready yet." }, { status: 409 });
  const { data: existing } = await db.from("post_media").select("id,media_type,mime_type,storage_path").eq("post_id", postId);
  const attached = (existing || []).find(media => media.storage_path.endsWith(`/jox-upload-${inspectionId}.webm`));
  if (attached) { await db.storage.from(POST_MEDIA_BUCKET).remove([path]); await db.from("media_inspections").delete().eq("id", inspectionId).eq("uploader_user_id", user.id); return NextResponse.json({ mediaId: attached.id }, { status: 200 }); }
  if (!allowsMediaComposition("jox", [...(existing || []).map(media => ({ type: media.media_type, mimeType: media.mime_type })), { type: "audio", mimeType: "audio/webm" }])) return NextResponse.json({ error: "This draft already has a Jox." }, { status: 409 });
  const claim = await db.from("media_inspections").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", inspectionId).eq("uploader_user_id", user.id).eq("purpose", "jox_audio").eq("status", "ready").select("id").maybeSingle();
  if (claim.error) return NextResponse.json({ error: "Could not prepare your Jox." }, { status: 503 });
  if (!claim.data) return NextResponse.json({ error: "This Jox is already being prepared." }, { status: 409 });
  const folder = post.author_organization_id ? `organizations/${post.author_organization_id}/${postId}` : `users/${user.id}/${postId}`, destination = `${folder}/jox-upload-${inspectionId}.webm`;
  const restore = async () => { await db.from("media_inspections").update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", inspectionId).eq("status", "processing"); };
  await db.storage.from(POST_MEDIA_BUCKET).remove([destination]);
  const copy = await db.storage.from(POST_MEDIA_BUCKET).copy(path, destination); if (copy.error) { await restore(); return NextResponse.json({ error: "Could not prepare your Jox." }, { status: 503 }); }
  const inserted = await db.from("post_media").insert({ post_id: postId, media_type: "audio", storage_path: destination, mime_type: "audio/webm;codecs=opus", file_name: "jox.webm", file_size_bytes: inspection.detected_size_bytes, duration_seconds: inspection.detected_duration_seconds, sort_order: (existing || []).length }).select("id").single();
  if (inserted.error || !inserted.data) { await db.storage.from(POST_MEDIA_BUCKET).remove([destination]); await restore(); return NextResponse.json({ error: "Could not attach your Jox." }, { status: 503 }); }
  await db.from("media_inspections").delete().eq("id", inspectionId).eq("uploader_user_id", user.id).eq("status", "ready"); await db.storage.from(POST_MEDIA_BUCKET).remove([path]); await updatePostType(postId);
  return NextResponse.json({ mediaId: inserted.data.id }, { status: 201 });
}
