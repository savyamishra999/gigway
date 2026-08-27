import { ImageResponse } from "next/og";
import { resolvePostAccess, safePost } from "@/lib/social/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await resolvePostAccess(id);
  if (!post || post.visibility !== "public") return new Response("Not found", { status: 404 });
  const value = await safePost(post);
  const special = value.momentSlug === "raksha-bandhan";
  const photo = value.media.find((item: any) => item.type === "image");
  const author = value.author?.name || "GigWay member";
  const username = value.author?.username ? `@${value.author.username}` : "";
  const text = (post.body || "View this post on GigWay.").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, photo ? 105 : 180);
  const accent = special ? "#c2410c" : "#4f46e5";
  const label = special ? "RAKSHA BANDHAN · GIGWAY MOMENT" : "GIGTHOUGHT";

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 44, gap: 34, background: special ? "#fff7ed" : "#f8fafc", fontFamily: "sans-serif", color: "#111827", border: special ? "16px solid #fed7aa" : undefined }}>
      <div style={{ display: "flex", flex: 1, minWidth: 0, flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: accent, fontSize: 30, fontWeight: 800 }}><span>GigWay</span></div>
          <div style={{ display: "flex", marginTop: 22, color: accent, fontSize: 17, letterSpacing: 2, fontWeight: 800 }}>{label}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 27, fontWeight: 700 }}>{author}</div>
          <div style={{ display: "flex", marginTop: 5, fontSize: 19, color: "#64748b" }}>{username}</div>
          <div style={{ display: "flex", marginTop: 25, fontSize: 31, lineHeight: 1.25 }}>{text}</div>
        </div>
        <div style={{ display: "flex", fontSize: 17, color: accent }}>{special ? "Celebrating the people who always have your back." : "gigway.in · Professional Network & Marketplace"}</div>
      </div>
      {photo && <div style={{ display: "flex", width: 430, borderRadius: 24, overflow: "hidden", background: "#e2e8f0" }}><img src={photo.url} width="430" height="542" style={{ objectFit: "cover", width: "100%", height: "100%" }} /></div>}
    </div>,
    { width: 1200, height: 630 },
  );
}
