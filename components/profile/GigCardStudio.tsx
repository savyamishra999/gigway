"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { CARD_ACCENTS, CARD_LIMITS, CARD_TEMPLATES, cardProfileUrl, initialCardDetails, type CardDetails, type CardProfile, type CardTemplate } from "@/lib/gigcard/model"
import { canvasBlob, loadCardPhoto, renderCard } from "@/lib/gigcard/render"
import { cardPdf, downloadCardBlob, shareCardImage } from "@/lib/gigcard/export"

type ExportSet = { signature: string; png: Blob; jpeg: Blob }
const labels: Record<keyof CardDetails, string> = { name: "Name", headline: "Professional headline", skills: "Skills or services", location: "Location", email: "Email on card (optional)", phone: "Phone on card (optional)" }
export default function GigCardStudio({ profile }: { profile: CardProfile }) {
  const [details, setDetails] = useState(() => initialCardDetails(profile))
  const [template, setTemplate] = useState<CardTemplate>("noir")
  const [showBrand, setShowBrand] = useState(true)
  const photoInput = useRef<HTMLInputElement>(null)
  const [accent, setAccent] = useState<string>(CARD_ACCENTS[0])
  const [photo, setPhoto] = useState(profile.avatar_url || "")
  const [exports, setExports] = useState<ExportSet | null>(null)
  const [notice, setNotice] = useState("")
  const [renderError, setRenderError] = useState("")
  const [photoWarning, setPhotoWarning] = useState("")
  const [busy, setBusy] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null), uploaded = useRef<string | null>(null)
  const signature = JSON.stringify([details, template, accent, photo, profile.username, showBrand])
  const ready = exports?.signature === signature && !!details.name.trim() && !renderError
  useEffect(() => () => { if (uploaded.current) URL.revokeObjectURL(uploaded.current) }, [])
  useEffect(() => {
    let cancelled = false
    setRenderError(""); setPhotoWarning("")
    const timer = setTimeout(async () => {
      try {
        const image = await loadCardPhoto(photo)
        if (cancelled || !canvas.current) return
        // Render off-screen so cancelled work never replaces the displayed card.
        const next = document.createElement("canvas")
        renderCard(next, details, profile.username, template, accent, image, showBrand)
        const [png, jpeg] = await Promise.all([canvasBlob(next, "image/png"), canvasBlob(next, "image/jpeg")])
        if (cancelled || !canvas.current) return
        canvas.current.width = next.width; canvas.current.height = next.height
        canvas.current.getContext("2d")?.drawImage(next, 0, 0)
        setExports({ signature, png, jpeg })
        if (photo && !image) setPhotoWarning("Your photo could not be loaded. Initials are shown; upload a local photo to include it.")
      } catch (error) { if (!cancelled) setRenderError(error instanceof Error ? error.message : "Preview unavailable. Try again.") }
    }, 180)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [signature, details, profile.username, template, accent, photo, showBrand])

  function upload(file?: File) {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setNotice("Choose a JPG, PNG or WebP photo smaller than 5 MB."); return }
    if (uploaded.current) URL.revokeObjectURL(uploaded.current)
    uploaded.current = URL.createObjectURL(file); setPhoto(uploaded.current); setNotice("")
  }
  async function exportFile(format: "png" | "jpeg" | "pdf") {
    if (!ready || !exports || busy) return
    setBusy(true); setNotice("")
    try {
      const blob = format === "pdf" ? await cardPdf(exports.jpeg, cardProfileUrl(profile.username)) : exports[format]
      downloadCardBlob(blob, `gigcard-${profile.username}-${template}-preview.${format === "jpeg" ? "jpg" : format}`)
      setNotice("Download prepared. Preview exports include a design-preview label.")
    } catch (error) { setNotice(error instanceof Error ? error.message : "Download failed. Please retry.") }
    finally { setBusy(false) }
  }
  async function share() {
    if (!ready || !exports || busy) return
    // The file is already rendered, preserving the click's native share activation.
    const file = new File([exports.png], `gigcard-${profile.username}-preview.png`, { type: "image/png" })
    setBusy(true); setNotice("")
    try {
      const result = await shareCardImage(file)
      setNotice(result === "downloaded" ? "Image sharing is not supported here. PNG downloaded—attach it in WhatsApp." : result === "shared" ? "Card handed to your selected app." : "")
    } catch (error) { setNotice(error instanceof Error ? error.message : "Share failed. Download PNG instead.") }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#f5f4fa] px-4 py-7 pb-28 text-brand-midnight sm:py-10">
    <div className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.2em] text-brand-indigo">GIGCARD STUDIO</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Make your first impression count.</h1><p className="mt-3 max-w-xl text-sm text-brand-slate">Choose your style. Make it yours. Take your professional identity anywhere.</p></div><Link href="/profile" className="min-h-11 rounded-xl border bg-white px-4 py-3 text-sm font-semibold">Back to profile</Link></header>
      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section id="card-details" aria-label="Card editor" className="order-2 scroll-mt-24 rounded-2xl border border-white bg-white p-5 shadow-soft lg:order-1">
          <h2 className="text-2xl font-bold">Your details</h2><p className="mt-2 text-base leading-7 text-brand-slate">These edits stay in this tab and do not change your profile. Downloads include only what you choose here.</p>
          <div className="mt-6 space-y-6">{(Object.keys(labels) as (keyof CardDetails)[]).map(key => <label key={key} className="block text-base font-semibold leading-6">{labels[key]}<input value={details[key]} maxLength={CARD_LIMITS[key]} onChange={e => setDetails(current => ({ ...current, [key]: e.target.value }))} className="mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal" autoComplete="off" /></label>)}</div>
          <p className="mt-3 text-xs leading-5 text-brand-slate">Only add contact details you want recipients to see. Contact details are never loaded from your private account.</p>
          <label className="mt-6 block text-base font-bold">Add your own photo<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { upload(e.target.files?.[0]); e.target.value = "" }} className="mt-3 block w-full min-w-0 text-base file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-100 file:px-4 file:py-3 file:font-semibold file:text-indigo-800" /></label>
          <button onClick={() => setPhoto("")} className="mt-2 min-h-11 text-sm font-semibold text-brand-indigo">Use initials instead</button>
          <button onClick={() => { setDetails(initialCardDetails(profile)); setPhoto(profile.avatar_url || ""); setNotice("") }} className="ml-3 mt-2 min-h-11 text-sm text-brand-slate">Reset details</button>
          <a href="#card-preview" className="mt-3 block min-h-11 py-3 text-sm font-bold text-brand-indigo lg:hidden">Back to card preview ↑</a>
        </section>
        <section id="card-preview" aria-label="Card design and exports" className="order-1 min-w-0 scroll-mt-24 space-y-5 lg:order-2">
          <a href="#card-details" className="inline-flex min-h-11 items-center rounded-xl border bg-white px-4 text-sm font-bold text-brand-indigo lg:hidden">Edit your details and photo ↓</a>
          <fieldset><legend className="mb-3 text-sm font-bold">1. Choose a design</legend><div className="grid grid-cols-3 gap-2">{CARD_TEMPLATES.map(t => <button key={t.id} aria-pressed={template === t.id} onClick={() => setTemplate(t.id)} className={`min-w-0 rounded-xl border-2 p-3 text-left ${template === t.id ? "border-brand-indigo ring-2 ring-indigo-100" : "border-transparent"}`} style={{ background: t.background, color: t.foreground }}><span className="block text-sm font-bold">{t.name}</span><span className="mt-1 hidden text-[11px] leading-4 sm:block">{t.description}</span></button>)}</div></fieldset>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#dddce8] p-3 shadow-soft sm:p-5"><canvas ref={canvas} role="img" aria-label={`GigCard ${template} preview for ${details.name || "your name"}. ${details.headline}. Profile QR links to ${cardProfileUrl(profile.username)}`} className="aspect-[9/5] h-auto w-full rounded-xl shadow-xl" /></div>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4"><button type="button" onClick={() => photoInput.current?.click()} className="min-h-12 rounded-xl bg-brand-indigo px-5 py-3 text-base font-bold text-white">Upload your photo</button><p className="text-sm text-brand-slate">JPG, PNG or WebP, up to 5 MB. Used on this card only.</p></div>
          <label className="flex min-h-12 items-center gap-3 rounded-xl bg-white p-4 text-base font-semibold"><input type="checkbox" checked={showBrand} onChange={e => setShowBrand(e.target.checked)} className="h-5 w-5" />Show GigWay branding</label><p className="text-sm text-brand-slate">Turn off to hide the GigWay name and printed profile address. The QR still opens your GigWay profile; the design-preview label remains.</p>
          <fieldset className="flex flex-wrap items-center gap-3"><legend className="mb-2 text-sm font-bold">2. Pick an accent</legend>{CARD_ACCENTS.map((color, i) => <button key={color} aria-label={`${["Violet", "Teal", "Amber"][i]} accent`} aria-pressed={accent === color} onClick={() => setAccent(color)} className={`h-11 w-11 rounded-full border-4 ${accent === color ? "border-brand-midnight" : "border-white"}`} style={{ background: color }} />)}</fieldset>
          {photoWarning && <p role="status" className="text-sm text-amber-800">{photoWarning}</p>}
          {renderError && <p role="alert" className="text-sm text-red-700">{renderError}</p>}
          {!ready && !renderError && <p role="status" className="text-sm text-brand-slate">{details.name.trim() ? "Preparing your card…" : "Add your name to export your card."}</p>}
          <section className="rounded-2xl bg-white p-5 shadow-soft"><h2 className="font-bold">3. Try your card</h2><p className="mt-2 text-sm text-brand-slate">Design preview · Purchases are paused. These sample exports carry a small preview label.</p><div className="mt-4 flex flex-wrap gap-2">{(["png", "jpeg", "pdf"] as const).map(format => <button key={format} disabled={!ready || busy} onClick={() => void exportFile(format)} className="min-h-11 rounded-xl border border-indigo-100 px-4 py-2 text-sm font-semibold text-brand-indigo disabled:opacity-40">Download {format === "jpeg" ? "JPG" : format.toUpperCase()}</button>)}</div>
            <button disabled={!ready || busy} onClick={() => void share()} className="mt-3 min-h-11 w-full rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white disabled:opacity-40">Share card image</button>
            <p className="mt-2 text-xs text-brand-slate">Choose WhatsApp in your device's share menu. If unavailable, download PNG and attach it yourself.</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-brand-indigo"><button onClick={async () => { try { await navigator.clipboard.writeText(cardProfileUrl(profile.username)); setNotice("Profile link copied. This shares your live profile, not your card design.") } catch { setNotice(`Copy this profile link: ${cardProfileUrl(profile.username)}`) } }}>Copy profile link</button><a href={`https://wa.me/?text=${encodeURIComponent(cardProfileUrl(profile.username))}`} target="_blank" rel="noopener noreferrer">WhatsApp profile link ↗</a></div>
            <p className="mt-3 text-xs text-brand-slate">PNG/JPG: 1800 × 1000 px. PDF: 90 × 50 mm, RGB, no bleed. Check your printer's requirements.</p>
            {notice && <p role="status" className="mt-3 text-sm text-brand-midnight">{notice}</p>}
          </section>
        </section>
      </div>
    </div>
  </main>
}
