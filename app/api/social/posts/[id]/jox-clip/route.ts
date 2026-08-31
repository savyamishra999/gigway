import { NextRequest, NextResponse } from "next/server";
import { canManagePost, requireSocialUser, socialDb } from "@/lib/social/server";
import { JOX_CLIP_PROFILE, JOX_CLIP_TEMPLATE_VERSION, joxClipFingerprint, joxClipRenditionKey, validJoxClipSource } from "@/lib/social/jox-clip";
import { enqueueJoxClipRender, joxClipQueueConfigured } from "@/lib/social/jox-clip-queue";

export const runtime = "nodejs";

const fields = "id,post_id,profile,status,storage_path,error_code";
const response = (item: any) => NextResponse.json({ renditionId: item.id, status: item.status, profile: item.profile, clipUrl: item.status === "ready" ? `/social/posts/${item.post_id}/jox-clip` : null, canRetry: item.status === "failed" });

async function sourceForCreator(id: string, userId: string) {
  const db = socialDb();
  const { data: post } = await db.from("posts").select("id,author_user_id,author_organization_id,status,visibility").eq("id", id).maybeSingle();
  if (!post || !await canManagePost(post, userId)) return { error: "Not found.", status: 404 as const };
  if (post.status !== "published" || post.visibility !== "public") return { error: "Jox Clips are available only for public published Joxes.", status: 422 as const };
  const { data: media } = await db.from("post_media").select("id,media_type,mime_type,storage_path,duration_seconds,sort_order").eq("post_id", id).order("sort_order");
  const audio = (media || []).find((item: any) => validJoxClipSource(item));
  if (!audio) return { error: "This post does not have an eligible Jox recording.", status: 422 as const };
  const image = (media || []).find((item: any) => item.media_type === "image") || null;
  return { db, post, audio, image };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params, source = await sourceForCreator(id, user.id);
  if ("error" in source) return NextResponse.json({ error: source.error }, { status: source.status });
  const fingerprint = joxClipFingerprint(id, source.audio, source.image);
  const { data } = await source.db.from("jox_renditions").select(fields).eq("post_id", id).eq("source_fingerprint", fingerprint).eq("template_version", JOX_CLIP_TEMPLATE_VERSION).eq("profile", JOX_CLIP_PROFILE).maybeSingle();
  return data ? response(data) : NextResponse.json({ renditionId: null, status: null, profile: JOX_CLIP_PROFILE, clipUrl: null, canRetry: false });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params, source = await sourceForCreator(id, user.id);
  if ("error" in source) return NextResponse.json({ error: source.error }, { status: source.status });
  const fingerprint = joxClipFingerprint(id, source.audio, source.image);
  const existing = await source.db.from("jox_renditions").select(fields).eq("post_id", id).eq("source_fingerprint", fingerprint).eq("template_version", JOX_CLIP_TEMPLATE_VERSION).eq("profile", JOX_CLIP_PROFILE).maybeSingle();
  if (existing.data && existing.data.status !== "failed") return response(existing.data);
  if (!joxClipQueueConfigured()) return NextResponse.json({ error: "Jox Clip rendering is not configured.", code: "jox_clip_rendering_unavailable" }, { status: 503 });
  const key = joxClipRenditionKey(id, fingerprint);
  const created = existing.data ? await source.db.from("jox_renditions").update({ status: "queued", error_code: null, completed_at: null, updated_at: new Date().toISOString() }).eq("id", existing.data.id).eq("status", "failed").select(fields).maybeSingle() : await source.db.from("jox_renditions").insert({ post_id: id, source_audio_media_id: source.audio.id, source_image_media_id: source.image?.id || null, rendition_key: key, template_version: JOX_CLIP_TEMPLATE_VERSION, profile: JOX_CLIP_PROFILE, status: "queued", source_fingerprint: fingerprint }).select(fields).single();
  if (created.error || !created.data) {
    const concurrent = await source.db.from("jox_renditions").select(fields).eq("post_id", id).eq("source_fingerprint", fingerprint).eq("template_version", JOX_CLIP_TEMPLATE_VERSION).eq("profile", JOX_CLIP_PROFILE).maybeSingle();
    if (concurrent.data) return response(concurrent.data);
    return NextResponse.json({ error: "Could not prepare Jox Clip." }, { status: 503 });
  }
  try { await enqueueJoxClipRender({ renditionId: created.data.id }); }
  catch (error) {
    console.error(JSON.stringify({ event: "jox_clip_task_enqueue_failed", renditionId: created.data.id }));
    if (existing.data) await source.db.from("jox_renditions").update({ status: "failed", error_code: "queue_failed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", created.data.id).eq("status", "queued");
    else await source.db.from("jox_renditions").delete().eq("id", created.data.id).eq("status", "queued");
    return NextResponse.json({ error: "Could not queue Jox Clip rendering.", code: "jox_clip_queue_failed" }, { status: 503 });
  }
  return response(created.data);
}
