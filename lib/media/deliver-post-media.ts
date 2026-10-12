import { NextRequest } from "next/server";
import { POST_MEDIA_BUCKET, resolvePostAccess, requireSocialUser, socialDb } from "@/lib/social/server";
import { createHash } from "node:crypto";
import { IMAGE_WIDTHS } from "@/lib/media/image-policy";
import { cachedImage, optimizeImage, readImageBody } from "@/lib/media/image-server";

export async function deliverPostMedia(request: NextRequest, params: Promise<{ id: string; mediaId: string }>, authenticated = false) {
  const { id, mediaId } = await params;
  const user = authenticated ? await requireSocialUser() : null;
  const post = await resolvePostAccess(id, user?.id);
  if (!post || (!authenticated && post.visibility !== "public")) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const { data: media } = await socialDb().from("post_media").select("id,storage_path,mime_type,media_type,file_size_bytes").eq("id", mediaId).eq("post_id", id).in("media_type", ["audio", "video", "image", "document"]).maybeSingle();
  if (!media) return new Response("Not found", { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return new Response("Media unavailable", { status: 503 });
  const widthParam = request.nextUrl.searchParams.get("w");
  const width = widthParam === null ? undefined : Number(widthParam);
  if (widthParam !== null && !IMAGE_WIDTHS.includes(width as typeof IMAGE_WIDTHS[number])) return new Response("Invalid width", { status: 400 });
  if (width && (media.media_type !== "image" || !IMAGE_WIDTHS.includes(width as typeof IMAGE_WIDTHS[number]))) return new Response("Invalid width", { status: 400 });
  // Revalidate visibility/membership before EVERY 304. Never share-cache a post:
  // public posts can become private or be deleted while the URL remains the same.
  const etag = `"${createHash("sha256").update(`${media.storage_path}:${media.file_size_bytes}:${width || "original"}:v1`).digest("hex")}"`;
  const responseHeaders = new Headers({ "Cache-Control": "private, no-cache", "ETag": etag, "Content-Type": media.mime_type, "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" });
  if (request.headers.get("if-none-match")?.split(",").map(value => value.trim()).includes(etag)) return new Response(null, { status: 304, headers: { "Cache-Control": "private, no-cache", ETag: etag } });
  const objectPath = media.storage_path.split("/").map(encodeURIComponent).join("/");
  const headers = new Headers({ apikey: serviceKey, Authorization: `Bearer ${serviceKey}` });
  const range = request.headers.get("range");
  if (range && (!request.headers.has("if-range") || request.headers.get("if-range") === etag)) headers.set("Range", range);
  const sourceUrl = `${baseUrl}/storage/v1/object/authenticated/${POST_MEDIA_BUCKET}/${objectPath}`;
  if (media.media_type === "image" && !headers.has("Range")) {
    try {
      const asset = await cachedImage(`post:${sourceUrl}:${width}`, async () => {
        const source = await cachedImage(`post:${sourceUrl}`, async () => {
          const response = await fetch(sourceUrl, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000) });
          if (!response.ok) throw new Error("Image unavailable");
          return { bytes: await readImageBody(response), type: media.mime_type };
        });
        return width ? optimizeImage(source.bytes, source.type, width) : source;
      });
      responseHeaders.set("Content-Type", asset.type);
      responseHeaders.set("Content-Length", String(asset.bytes.length));
      responseHeaders.delete("Accept-Ranges");
      return new Response(request.method === "HEAD" ? null : new Uint8Array(asset.bytes), { headers: responseHeaders });
    } catch { return new Response("Media unavailable", { status: 503, headers: { "Cache-Control": "no-store" } }); }
  }
  const upstream = await fetch(sourceUrl, { method: request.method, headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(60_000) });
  if (!upstream.ok) return new Response("Media unavailable", { status: upstream.status === 416 ? 416 : 503, headers: { "Cache-Control": "no-store" } });

  for (const name of ["content-length", "content-range"]) { const value = upstream.headers.get(name); if (value) responseHeaders.set(name, value); }
  return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
}
