export const GIGCARD_PRICE_PAISE = 9900
export const GIGCARD_PRICE_LABEL = "₹99"
export type CardAction = "png" | "jpeg" | "pdf" | "share"
export const CARD_ACTION_LABELS: Record<CardAction, string> = {
  png: "Download PNG", jpeg: "Download JPG", pdf: "Download PDF", share: "Share card image",
}
