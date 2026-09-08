import { NextRequest, NextResponse } from "next/server";
import { POST_MEDIA_BUCKET, requireSocialUser, socialDb } from "@/lib/social/server";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = await requireSocialUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.fileName !== "string" || typeof body.mimeType !== "string" || typeof body.fileSize !== "number" || body.fileSize < 1 || body.fileSize > MAX_BYTES || body.mimeType.toLowerCase().split(";")[0].trim() !== "audio/webm" || body.fileName.trim().split(".").pop()?.toLowerCase() !== "webm") return NextResponse.json({ error: "Choose a WebM audio file up to 10 MB." }, { status: 400 });
  const inspectionId = crypto.randomUUID(), path = `users/${user.id}/jox-temp/${inspectionId}/source.webm`;
  const { data, error } = await socialDb().storage.from(POST_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "Could not prepare your Jox upload." }, { status: 503 });
  return NextResponse.json({ inspectionId, path: data.path, token: data.token });
}
