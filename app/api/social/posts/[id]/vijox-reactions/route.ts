import { NextRequest, NextResponse } from "next/server";
import { isValidJoxMedia, requireSocialUser, resolvePostAccess, socialDb } from "@/lib/social/server";
import { aggregateVijoxTimedReactions, VIJOX_REACTION_TYPES, type VijoxTimedReactionType, zeroVijoxTimedReactionSummary } from "@/lib/social/vijox-timed-reactions";

const types = new Set<string>(VIJOX_REACTION_TYPES);
type ReactionType = VijoxTimedReactionType;
const validInput = (body: unknown) => {
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (!types.has(value.reactionType as string)) return { error: "Choose a valid VIJOX reaction." } as const;
  if (typeof value.timestampMs !== "number" || !Number.isSafeInteger(value.timestampMs) || value.timestampMs < 0 || value.timestampMs > 27000) return { error: "Choose a valid whole-millisecond VIJOX moment." } as const;
  return { reactionType: value.reactionType as ReactionType, timestampMs: value.timestampMs } as const;
};
async function vijoxDuration(postId: string) {
  const { data } = await socialDb().from("post_media").select("duration_seconds,media_type,mime_type").eq("post_id", postId).eq("media_type", "audio");
  const valid = (data || []).find(media => isValidJoxMedia(media.media_type, media.mime_type));
  return typeof valid?.duration_seconds === "number" && Number.isFinite(valid.duration_seconds) && valid.duration_seconds > 0 ? valid.duration_seconds : null;
}
async function accessibleVijox(postId: string, userId?: string) {
  const post = await resolvePostAccess(postId, userId);
  if (!post) return { error: NextResponse.json({ error: "Post not found." }, { status: 404 }) } as const;
  const duration = await vijoxDuration(postId);
  if (!duration) return { error: NextResponse.json({ error: "This post doesn't contain a valid Jox." }, { status: 400 }) } as const;
  return { duration } as const;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params, input = validInput(await req.json().catch(() => null)); if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });
  const access = await accessibleVijox(id, user.id); if ("error" in access) return access.error;
  if (input.timestampMs > Math.floor(access.duration * 1000)) return NextResponse.json({ error: "That moment exceeds this VIJOX duration." }, { status: 400 });
  const db = socialDb(), bucket = Math.floor(input.timestampMs / 500) * 500;
  const { data: existing } = await db.from("vijox_timed_reactions").select("id,reaction_type,time_bucket_ms").eq("post_id", id).eq("reactor_user_id", user.id).eq("reaction_type", input.reactionType).eq("time_bucket_ms", bucket).maybeSingle();
  if (existing) return NextResponse.json({ reaction: { reactionType: existing.reaction_type, timestampMs: existing.time_bucket_ms }, existing: true });
  const { data, error } = await db.from("vijox_timed_reactions").insert({ post_id: id, reactor_user_id: user.id, reaction_type: input.reactionType, timestamp_ms: input.timestampMs }).select("reaction_type,time_bucket_ms").single();
  if (error?.code === "23505") return NextResponse.json({ reaction: { reactionType: input.reactionType, timestampMs: bucket }, existing: true });
  if (error || !data) return NextResponse.json({ error: "Could not save VIJOX reaction." }, { status: 503 });
  return NextResponse.json({ reaction: { reactionType: data.reaction_type, timestampMs: data.time_bucket_ms }, existing: false }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params, input = validInput(await req.json().catch(() => null)); if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });
  const access = await accessibleVijox(id, user.id); if ("error" in access) return access.error;
  if (input.timestampMs > Math.floor(access.duration * 1000)) return NextResponse.json({ error: "That moment exceeds this VIJOX duration." }, { status: 400 });
  const { error } = await socialDb().from("vijox_timed_reactions").delete().eq("post_id", id).eq("reactor_user_id", user.id).eq("reaction_type", input.reactionType).eq("time_bucket_ms", Math.floor(input.timestampMs / 500) * 500);
  if (error) return NextResponse.json({ error: "Could not remove VIJOX reaction." }, { status: 503 }); return NextResponse.json({ success: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser(), { id } = await params, access = await accessibleVijox(id, user?.id); if ("error" in access) return access.error;
  const db = socialDb(), { data, error } = await db.from("vijox_timed_reactions").select("reaction_type,time_bucket_ms,reactor_user_id").eq("post_id", id).order("time_bucket_ms");
  if (error) return NextResponse.json({ error: "Could not load VIJOX reactions." }, { status: 503 });
  return NextResponse.json(aggregateVijoxTimedReactions((data || []).map(reaction => ({ ...reaction, post_id: id, reaction_type: reaction.reaction_type as ReactionType })) as any, user?.id).get(id) || zeroVijoxTimedReactionSummary());
}
