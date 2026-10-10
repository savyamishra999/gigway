import "server-only"
import sharp from "sharp"
import { jsPDF } from "jspdf"
import { cardDestination } from "./model"
import { cardQr } from "./render"
import { validateDesign, type CardDesign } from "./design"

const escapeXml = (text: string) => text.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!))

export async function normalizeCardPhoto(photo: string) {
  if (!photo) return ""
  const data = Buffer.from(photo.slice("data:image/png;base64,".length), "base64")
  if (data.length > 1_125_000 || data.length < 24 || data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw Error("Invalid card photo.")
  // Reject decompression bombs before image decode; sharp also enforces pixels.
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20)
  if (!width || !height || width > 1024 || height > 1024) throw Error("Card photo must be 1024 pixels or smaller.")
  const normalized = await sharp(data, { limitInputPixels: 1024 * 1024 }).resize(512, 512, { fit: "cover" }).png().toBuffer()
  return `data:image/png;base64,${normalized.toString("base64")}`
}

function textRows(value: string, x: number, y: number, width: number, size: number, fill: string, weight = 500, count = 2) {
  // Conservative wrapping plus an SVG clip bounds arbitrary Unicode/long names.
  const max = Math.max(1, Math.floor(width / (size * .66)))
  const words = Array.from(value), rows: string[] = []
  while (words.length && rows.length < count) {
    let row = words.splice(0, max).join("")
    if (words.length && rows.length === count - 1) row = row.slice(0, -1) + "…"
    rows.push(row)
  }
  return rows.map((row, i) => `<svg x="${x}" y="${y + i * size * 1.22 - size}" width="${width}" height="${size * 1.3}" overflow="hidden"><text x="0" y="${size}" fill="${fill}" font-size="${size}" font-weight="${weight}">${escapeXml(row)}</text></svg>`).join("")
}

export async function paidCardImage(designValue: CardDesign, username: string, format: "png" | "jpeg" | "pdf") {
  const d = validateDesign(designValue), t = d.details
  const photo = await normalizeCardPhoto(d.photo)
  const light = d.template === "studio", x = light ? 570 : 100, width = light ? 1110 : 1010
  const fg = light ? "#17243a" : "#ffffff", secondary = light ? "#40347b" : "#f1ecff", muted = light ? "#4b5563" : "#e0def1"
  const px = light ? 280 : 1470, py = light ? 375 : 312, radius = light ? 152 : 185
  const qr = cardQr(username, t.website), n = qr.getModuleCount(), cell = Math.floor(252 / (n + 8)), side = (n + 8) * cell, left = px - side / 2, top = 564
  let modules = ""
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) if (qr.isDark(row, col)) modules += `<rect x="${left + (col + 4) * cell}" y="${top + (row + 4) * cell}" width="${cell}" height="${cell}"/>`
  const footer = t.website ? cardDestination(username, t.website).slice(8) : d.showBrand ? `gigway.in/u/${username}` : ""
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000" font-family="Arial, sans-serif">
    <defs><linearGradient id="prism" x2="1" y2="1"><stop stop-color="#262463"/><stop offset=".55" stop-color="#5741c9"/><stop offset="1" stop-color="#c65187"/></linearGradient><clipPath id="photo"><circle cx="${px}" cy="${py}" r="${radius}"/></clipPath></defs>
    <rect width="1800" height="1000" fill="${light ? "#faf7f0" : d.template === "prism" ? "url(#prism)" : "#101321"}"/>
    <circle cx="1600" cy="30" r="520" fill="${light ? "#efe8da" : "#ffffff"}" opacity="${light ? 1 : .05}"/>
    <rect width="20" height="1000" fill="${d.accent}"/>
    ${textRows(t.company || (d.showBrand ? "GigWay" : ""), 95, 110, 1580, 48, secondary, 700, 1)}
    ${textRows(t.company ? "BUSINESS CARD" : "PROFESSIONAL CARD", 95, 157, 1000, 22, muted, 500, 1)}
    ${light ? '<rect x="485" y="225" width="2" height="560" fill="#dfd7e5"/>' : ""}
    ${textRows(t.name, x, 280, width, 104, fg, 700)}
    ${textRows(t.headline, x, 455, width, 70, secondary)}
    ${textRows(t.skills, x, 630, width, 58, muted)}
    ${textRows(t.location, x, 755, width, 46, muted, 500, 1)}
    ${textRows(t.email, x, 817, width, 38, muted, 500, 1)}
    ${textRows(t.phone, x, 872, width, 38, muted, 500, 1)}
    <path d="M95 904H1705" stroke="${muted}" opacity=".2"/>
    ${textRows(footer, 100, 966, 1550, 32, secondary, 600, 1)}
    <g clip-path="url(#photo)"><circle cx="${px}" cy="${py}" r="${radius}" fill="${d.accent}"/>
    ${photo ? `<image href="${photo}" x="${px - radius}" y="${py - radius}" width="${radius * 2}" height="${radius * 2}" preserveAspectRatio="xMidYMid slice"/>` : `<text x="${px}" y="${py + 52}" text-anchor="middle" font-size="145" font-weight="700" fill="#17172b">${escapeXml(Array.from(t.name)[0].toUpperCase())}</text>`}</g>
    <rect x="${left}" y="${top}" width="${side}" height="${side}" fill="#fff"/><g fill="#101321">${modules}</g>
    <text x="${px}" y="${top + side + 35}" text-anchor="middle" font-size="21" fill="${muted}">SCAN TO CONNECT</text>
  </svg>`
  // No external URLs are embedded in the SVG. Only sanitized text and normalized PNG data.
  const image = sharp(Buffer.from(svg), { limitInputPixels: 2_000_000 })
  if (format === "png") return { bytes: await image.png().toBuffer(), type: "image/png", extension: "png" }
  const jpeg = await image.jpeg({ quality: 95 }).toBuffer()
  if (format === "jpeg") return { bytes: jpeg, type: "image/jpeg", extension: "jpg" }
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [90, 50], compress: true })
  pdf.setProperties({ title: `${t.name} — business card` })
  pdf.addImage(`data:image/jpeg;base64,${jpeg.toString("base64")}`, "JPEG", 0, 0, 90, 50)
  pdf.link(0, 0, 90, 50, { url: cardDestination(username, t.website) })
  return { bytes: Buffer.from(pdf.output("arraybuffer")), type: "application/pdf", extension: "pdf" }
}
