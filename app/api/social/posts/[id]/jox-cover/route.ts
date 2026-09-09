import { NextRequest, NextResponse } from "next/server";
import { canManagePost, requireSocialUser, socialDb } from "@/lib/social/server";
import { isJox } from "@/lib/social/content-domain";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params, body = await request.json().catch(() => ({})), mediaId = body.mediaId;
  if (!UUID.test(id) || (mediaId !== null && (typeof mediaId !== "string" || !UUID.test(mediaId)))) return NextResponse.json({ error: "Invalid Jox cover." }, { status: 400 });
  const number = (value: unknown, fallback: number, min: number, max: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  const scale = number(body.scale, 1, 1, 3), positionX = number(body.positionX, 0, -1, 1), positionY = number(body.positionY, 0, -1, 1);
  const db = socialDb(), [{ data: post }, { data: media }] = await Promise.all([
    db.from("posts").select("id,author_user_id,author_organization_id,content_format").eq("id", id).maybeSingle(),
    mediaId ? db.from("post_media").select("id,post_id,media_type").eq("id", mediaId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!post || !isJox(post.content_format) || !await canManagePost(post, user.id)) return NextResponse.json({ error: "Jox draft not found." }, { status: 404 });
  if (mediaId && (!media || media.post_id !== id || media.media_type !== "image")) return NextResponse.json({ error: "Choose an image attached to this Jox." }, { status: 400 });
  const update = mediaId ? { jox_cover_media_id: mediaId, jox_cover_scale: scale, jox_cover_position_x: positionX, jox_cover_position_y: positionY, updated_at: new Date().toISOString() } : { jox_cover_media_id: null, jox_cover_scale: null, jox_cover_position_x: null, jox_cover_position_y: null, updated_at: new Date().toISOString() };
  const { error } = await db.from("posts").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not set Jox cover." }, { status: 503 });
  return NextResponse.json({ coverMediaId: mediaId, scale: mediaId ? scale : null, positionX: mediaId ? positionX : null, positionY: mediaId ? positionY : null });
}
