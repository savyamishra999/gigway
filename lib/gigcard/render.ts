import qrcode from "qrcode-generator"
import { CARD_TEMPLATES, cardProfileUrl, cleanCardDetails, type CardDetails, type CardTemplate } from "./model"

export const CARD_WIDTH = 1800
export const CARD_HEIGHT = 1000
export function cardQr(username: string) {
  const qr = qrcode(0, "M")
  qr.addData(cardProfileUrl(username)); qr.make()
  return qr
}
function lines(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, max: number, size: number, count = 2, weight = 500) {
  ctx.font = `${weight} ${size}px Arial, sans-serif`
  const chars = Array.from(value), rows: string[] = []; let row = ""
  for (const char of chars) {
    if (ctx.measureText(row + char).width > max && row) { rows.push(row.trim()); row = char.trimStart() }
    else row += char
  }
  if (row) rows.push(row)
  rows.slice(0, count).forEach((line, i) => {
    if (i === count - 1 && rows.length > count) {
      while (ctx.measureText(line + "…").width > max) line = line.slice(0, -1)
      line += "…"
    }
    ctx.fillText(line, x, y + i * size * 1.22)
  })
}
export function renderCard(canvas: HTMLCanvasElement, input: CardDetails, username: string, template: CardTemplate, accent: string, photo: CanvasImageSource | null, showBrand = true) {
  canvas.width = CARD_WIDTH; canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext("2d"); if (!ctx) throw Error("Card preview is not supported in this browser.")
  const details = cleanCardDetails(input), theme = CARD_TEMPLATES.find(t => t.id === template) || CARD_TEMPLATES[0]
  const light = theme.id === "studio"
  ctx.fillStyle = theme.background; ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  if (theme.id === "prism") {
    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    gradient.addColorStop(0, "#262463"); gradient.addColorStop(.55, "#5741c9"); gradient.addColorStop(1, "#c65187")
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.beginPath(); ctx.moveTo(1170, 0); ctx.lineTo(1800, 0); ctx.lineTo(1800, 1000); ctx.lineTo(1370, 1000); ctx.closePath(); ctx.fill()
  }
  ctx.fillStyle = light ? "#efe8da" : "rgba(255,255,255,0.05)"
  ctx.beginPath(); ctx.arc(1600, 30, 520, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = accent; ctx.fillRect(0, 0, 20, CARD_HEIGHT)
  ctx.fillStyle = light ? "#40347b" : accent; ctx.font = "bold 38px Arial"; if (showBrand) ctx.fillText("GigWay", 95, 110)
  ctx.fillStyle = light ? "#64748b" : "#ddd9f2"; ctx.font = "22px Arial"; ctx.fillText("PROFESSIONAL IDENTITY", 95, 157)
  const textX = light ? 570 : 100, textWidth = light ? 1110 : 1010
  if (light) { ctx.fillStyle = "#dfd7e5"; ctx.fillRect(485, 225, 2, 560) }
  ctx.fillStyle = theme.foreground; lines(ctx, details.name || "Your name", textX, 295, textWidth, light ? 78 : 86, 2, 700)
  ctx.fillStyle = light ? "#40347b" : "#f1ecff"; lines(ctx, details.headline, textX, 505, textWidth, 46)
  ctx.fillStyle = light ? "#4b5563" : "#e0def1"; lines(ctx, details.skills, textX, 645, textWidth, 36)
  lines(ctx, details.location, textX, 741, textWidth, 34, 1)
  const contact = [details.email, details.phone].filter(Boolean).join("  ·  ")
  lines(ctx, contact, textX, 798, textWidth, 32, 1)
  ctx.fillStyle = light ? "#dcd5e5" : "rgba(255,255,255,0.18)"; ctx.fillRect(95, 854, 1610, 2)
  ctx.fillStyle = light ? "#40347b" : "#ffffff"; if (showBrand) lines(ctx, `gigway.in/u/${username}`, 100, 916, 1110, 28, 1, 600)
  ctx.font = "18px Arial"; ctx.fillStyle = light ? "#64748b" : "#d5d1e8"; ctx.fillText("DESIGN PREVIEW", 1490, 925)
  const portraitX = light ? 280 : 1470, portraitY = light ? 375 : 312, radius = light ? 152 : 185
  ctx.save(); ctx.beginPath(); ctx.arc(portraitX, portraitY, radius, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = accent; ctx.fillRect(portraitX - radius, portraitY - radius, radius * 2, radius * 2)
  if (photo) {
    const image = photo as HTMLImageElement; const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height
    const side = Math.min(w, h)
    ctx.drawImage(photo, (w - side) / 2, (h - side) / 2, side, side, portraitX - radius, portraitY - radius, radius * 2, radius * 2)
  } else {
    ctx.fillStyle = "#17172b"; ctx.font = "bold 145px Arial"; ctx.textAlign = "center"; ctx.fillText(Array.from(details.name || "G")[0].toUpperCase(), portraitX, portraitY + 52); ctx.textAlign = "left"
  }
  ctx.restore()
  const qr = cardQr(username), count = qr.getModuleCount(), cell = Math.floor(252 / (count + 8)), side = (count + 8) * cell
  const left = portraitX - side / 2, top = 564
  ctx.fillStyle = "#ffffff"; ctx.fillRect(left, top, side, side)
  ctx.fillStyle = "#101321"
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) ctx.fillRect(left + (c + 4) * cell, top + (r + 4) * cell, cell, cell)
  ctx.fillStyle = light ? "#475569" : "#e0def1"; ctx.font = "21px Arial"; ctx.textAlign = "center"; ctx.fillText("SCAN TO CONNECT", portraitX, top + side + 35); ctx.textAlign = "left"
}
export function canvasBlob(canvas: HTMLCanvasElement, format: "image/png" | "image/jpeg") {
  return new Promise<Blob>((resolve, reject) => { try { canvas.toBlob(blob => blob ? resolve(blob) : reject(Error("Export failed. Try another photo.")), format, .95) } catch { reject(Error("Photo could not be exported. Upload a local photo or remove it.")) } })
}
export function loadCardPhoto(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise(resolve => {
    const image = new Image(); image.crossOrigin = "anonymous"; image.referrerPolicy = "no-referrer"
    const timer = setTimeout(() => { image.onload = image.onerror = null; image.src = ""; resolve(null) }, 8000)
    image.onload = () => { clearTimeout(timer); resolve(image) }
    image.onerror = () => { clearTimeout(timer); resolve(null) }
    image.src = url
  })
}
