import { ImageResponse } from "next/og";
import { resolvePostAccess, safePost } from "@/lib/social/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await resolvePostAccess(id);
  if (!post || post.visibility !== "public") return new Response("Not found", { status: 404 });

  const value = await safePost(post);
  const author = value.author?.name || "GigWay member", username = value.author?.username ? `@${value.author.username}` : "";
  const media = value.media.find((item: any) => item.type === "audio" || item.type === "video" || item.type === "document");
  const label = media?.type === "audio" ? "VIJOX · 27 sec voice" : media?.type === "video" ? "VIDEO" : media?.type === "document" ? "DOCUMENT / PDF" : "GIGTHOUGHT";
  const text = (post.body || "View this post on GigWay.").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 180);

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 64, background: "#f8fafc", fontFamily: "sans-serif", flexDirection: "column", justifyContent: "space-between", color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#4f46e5", fontSize: 34, fontWeight: 800 }}><span>GigWay</span><span style={{ fontSize: 22, letterSpacing: 2 }}>{label}</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>{author}</div><div style={{ display: "flex", fontSize: 20, color: "#64748b", marginTop: 8 }}>{username}</div><div style={{ display: "flex", fontSize: 38, lineHeight: 1.25, marginTop: 32 }}>{text}</div></div>
      <div style={{ display: "flex", fontSize: 18, color: "#4f46e5" }}>gigway.in · Professional Network & Marketplace</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
