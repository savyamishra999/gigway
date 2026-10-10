// A separate switch: never enable general billing, proposals or escrow for GigCard.
export const GIGCARD_LIVE_RELEASE_APPROVED = false
export function gigcardMode(): "paused" | "test" | "live" {
  const mode = process.env.GIGCARD_PAYMENTS_MODE
  if (mode === "test" && process.env.VERCEL_ENV !== "production") return "test"
  if (mode === "live" && GIGCARD_LIVE_RELEASE_APPROVED) return "live"
  return "paused"
}
