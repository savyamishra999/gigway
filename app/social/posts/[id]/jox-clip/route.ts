import { NextRequest } from "next/server";
import { JOX_CLIP_BUCKET } from "@/lib/social/jox-clip";
import { resolvePostAccess, socialDb } from "@/lib/social/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, post = await resolvePostAccess(id);
  if (!post || post.status !== "published" || post.visibility !== "public") return new Response("Not found", { status: 404 });
  const { data: rendition } = await socialDb().from("jox_renditions").select("storage_path").eq("post_id", id).eq("status", "ready").eq("profile", "vertical-720p").maybeSingle();
  if (!rendition?.storage_path) return new Response("Not found", { status: 404 });
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return new Response("Media unavailable", { status: 503 });
  const path = rendition.storage_path.split("/").map(encodeURIComponent).join("/"), headers = new Headers({ apikey: serviceKey, Authorization: `Bearer ${serviceKey}` });
  const range = request.headers.get("range"); if (range) headers.set("Range", range);
  const upstream = await fetch(`${baseUrl}/storage/v1/object/authenticated/${JOX_CLIP_BUCKET}/${path}`, { headers, cache: "no-store" });
  if (!upstream.ok) return new Response("Not found", { status: upstream.status === 416 ? 416 : 404 });
  const output = new Headers({ "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" });
  for (const name of ["content-length", "content-range"]) { const value = upstream.headers.get(name); if (value) output.set(name, value); }
  return new Response(upstream.body, { status: upstream.status, headers: output });
}
