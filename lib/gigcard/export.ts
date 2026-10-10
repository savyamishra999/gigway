export function downloadCardBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a")
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
export async function cardPdf(jpeg: Blob, profileUrl: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [90, 50], compress: true })
  pdf.setProperties({ title: "GigCard design preview", creator: "GigWay" })
  pdf.addImage(new Uint8Array(await jpeg.arrayBuffer()), "JPEG", 0, 0, 90, 50)
  pdf.link(0, 0, 90, 50, { url: profileUrl })
  return pdf.output("blob")
}
export async function shareCardImage(file: File): Promise<"shared" | "cancelled" | "downloaded"> {
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
    downloadCardBlob(file, file.name); return "downloaded"
  }
  try { await navigator.share({ files: [file], title: "My GigCard" }); return "shared" }
  catch (error) { if (error instanceof Error && error.name === "AbortError") return "cancelled"; throw Error("Image sharing is unavailable. Download PNG and attach it in WhatsApp.") }
}
