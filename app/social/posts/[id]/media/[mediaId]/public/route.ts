import { NextRequest } from "next/server";
import { POST_MEDIA_BUCKET, resolvePostAccess, socialDb } from "@/lib/social/server";

export const runtime = "nodejs";

async function deliver(request: NextRequest, params: Promise<{ id: string; mediaId: string }>) {
  const { id, mediaId } = await params;
  const post = await resolvePostAccess(id);
  if (!post || post.visibility !== "public") return new Response("Not found", { status: 404 });

  const { data: media } = await socialDb().from("post_media").select("id,storage_path,mime_type").eq("id", mediaId).eq("post_id", id).in("media_type", ["audio", "video"]).maybeSingle();
  if (!media) return new Response("Not found", { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return new Response("Media unavailable", { status: 503 });
  const objectPath = media.storage_path.split("/").map(encodeURIComponent).join("/");
  const headers = new Headers({ apikey: serviceKey, Authorization: `Bearer ${serviceKey}` });
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  const upstream = await fetch(`${baseUrl}/storage/v1/object/authenticated/${POST_MEDIA_BUCKET}/${objectPath}`, { method: request.method, headers, cache: "no-store" });
  if (!upstream.ok) return new Response("Not found", { status: upstream.status === 416 ? 416 : 404 });

  const responseHeaders = new Headers({ "Cache-Control": "private, no-store", "Content-Type": media.mime_type, "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" });
  for (const name of ["content-length", "content-range"]) { const value = upstream.headers.get(name); if (value) responseHeaders.set(name, value); }
  return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; mediaId: string }> }) { return deliver(request, params); }
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ id: string; mediaId: string }> }) { return deliver(request, params); }
