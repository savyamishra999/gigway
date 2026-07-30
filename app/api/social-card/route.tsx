import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const p          = new URL(req.url).searchParams
  const type       = p.get("type") || "gig"
  const title      = p.get("title") || "New on GigWay"
  const sub        = p.get("sub") || ""
  const price      = p.get("price") || ""
  const skills     = p.get("skills") || ""
  const location   = p.get("location") || ""
  const verified   = p.get("verified") === "1"

  const accent =
    type === "job"        ? "#F97316" :
    type === "freelancer" ? "#4ADE80" :
    /* gig */               "#818CF8"

  const badge =
    type === "job"        ? "💼 Job" :
    type === "freelancer" ? "👤 Freelancer" :
    /* gig */               "🎨 Gig"

  const chips = skills
    ? skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 5)
    : []

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex", flexDirection: "column",
          width: "100%", height: "100%",
          background: "linear-gradient(135deg,#0A0A0F 0%,#12121A 55%,#1a1a2e 100%)",
          padding: "52px 60px",
          fontFamily: "system-ui,sans-serif",
          position: "relative",
        }}
      >
        {/* Glow orb */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 380, height: 380, borderRadius: "50%",
          background: `radial-gradient(circle,${accent}22 0%,transparent 70%)`,
          display: "flex",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 44 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: accent, letterSpacing: -1 }}>gigWAY</span>
          <span style={{
            fontSize: 15, fontWeight: 700, color: accent,
            background: `${accent}18`, padding: "8px 22px",
            borderRadius: 24, border: `1px solid ${accent}35`,
          }}>
            {badge}
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <p style={{
            fontSize: title.length > 55 ? 40 : 52,
            fontWeight: 900, color: "white",
            margin: 0, lineHeight: 1.15, letterSpacing: -1,
          }}>
            {title.length > 85 ? title.slice(0, 85) + "…" : title}
          </p>

          {sub && (
            <p style={{ fontSize: 22, color: "#94A3B8", margin: "14px 0 0", fontWeight: 500 }}>
              {verified ? "✅ " : ""}{sub}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 18 }}>
            {price    && <span style={{ fontSize: 28, color: accent, fontWeight: 800 }}>{price}</span>}
            {location && <span style={{ fontSize: 18, color: "#64748B" }}>📍 {location}</span>}
          </div>

          {chips.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              {chips.map((s, i) => (
                <span key={i} style={{
                  fontSize: 15, color: "#CBD5E1",
                  background: "#1E2A3A", padding: "6px 16px",
                  borderRadius: 20, border: "1px solid #334155",
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid #1E1E2E", paddingTop: 22, marginTop: 22,
        }}>
          <span style={{ fontSize: 16, color: "#4B5563" }}>🌐 gigway.in</span>
          <span style={{ fontSize: 13, color: "#334155" }}>India's Zero Commission Platform · Free to join</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
