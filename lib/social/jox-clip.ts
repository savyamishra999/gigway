import { createHash } from "crypto";
import { isValidJoxMedia } from "@/lib/social/server";

export const JOX_CLIP_BUCKET = "jox-renditions";
export const JOX_CLIP_PROFILE = "vertical-720p";
export const JOX_CLIP_TEMPLATE_VERSION = "v1";
export const JOX_CLIP_MAX_DURATION_SECONDS = 27;
export type JoxClipStatus = "queued" | "rendering" | "ready" | "failed";

type SourceMedia = { id: string; media_type: string; mime_type: string; storage_path: string; duration_seconds: number | null };
type ImageMedia = { id: string; storage_path: string } | null;

export function validJoxClipSource(audio: SourceMedia | null | undefined): audio is SourceMedia & { duration_seconds: number } {
  const duration = audio?.duration_seconds;
  return !!audio && typeof duration === "number" && isValidJoxMedia(audio.media_type, audio.mime_type) && Number.isInteger(duration) && duration > 0 && duration <= JOX_CLIP_MAX_DURATION_SECONDS;
}

export function joxClipFingerprint(postId: string, audio: SourceMedia, image: ImageMedia) {
  return createHash("sha256").update(JSON.stringify({ postId, audio: { id: audio.id, path: audio.storage_path, mime: audio.mime_type, duration: audio.duration_seconds }, image: image ? { id: image.id, path: image.storage_path } : null, template: JOX_CLIP_TEMPLATE_VERSION, profile: JOX_CLIP_PROFILE })).digest("hex");
}

export function joxClipRenditionKey(postId: string, fingerprint: string) {
  return `jox/${postId}/share/${fingerprint}/${JOX_CLIP_TEMPLATE_VERSION}-${JOX_CLIP_PROFILE}.mp4`;
}

/** Trusted server-side worker payload. The worker must receive the real creator
 * avatar source explicitly; it must never invent or fall back to a placeholder. */
export type JoxClipRenderJob = { renditionId: string; postId: string; sourceAudioMediaId: string; sourceImageMediaId: string | null; creatorAvatarSource: string; templateVersion: typeof JOX_CLIP_TEMPLATE_VERSION; profile: typeof JOX_CLIP_PROFILE; outputStoragePath: string };

/** Queue-provider boundary. No provider is configured in this repository yet. */
export function joxClipQueueConfigured() { return false; }
