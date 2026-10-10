"use client"

import { useEffect, useRef, useState } from "react"
import { beginCardCheckout, fetchPaidCard, restoreCardPurchase } from "@/lib/gigcard/checkout-client"
import { downloadCardBlob, shareCardImage } from "@/lib/gigcard/export"
import { CARD_ACTION_LABELS, GIGCARD_PRICE_LABEL, type CardAction } from "@/lib/gigcard/purchase"

export default function GigCardPurchase({ ready, saveCard, onBusyChange }: { ready: boolean; saveCard: () => Promise<string>; onBusyChange: (busy: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [action, setAction] = useState<CardAction>("png")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [paidFile, setPaidFile] = useState<File | null>(null)
  const paymentInProgress = useRef(false)
  useEffect(() => { if (!ready && !paymentInProgress.current) { dialog.current?.close(); setPaidFile(null) } }, [ready])
  async function pay(restore = false) {
    if (paymentInProgress.current || !ready) return
    paymentInProgress.current = true; setBusy(true); onBusyChange(true); setMessage(""); setPaidFile(null)
    dialog.current?.close()
    try {
      const cardId = await saveCard()
      if (restore) await restoreCardPurchase(cardId)
      else if (await beginCardCheckout(action, cardId) === "cancelled") { setMessage("Payment cancelled. No card was unlocked."); return }
      const file = await fetchPaidCard(cardId, action)
      setPaidFile(file)
      if (action !== "share") downloadCardBlob(file, file.name)
      setMessage(action === "share" ? "Your paid card is ready. Tap Share paid card to choose an app." : "Your paid card download is ready. If it did not start, use the button below.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout unavailable. No card was unlocked.") }
    finally { paymentInProgress.current = false; setBusy(false); onBusyChange(false); dialog.current?.showModal() }
  }
  return <section className="rounded-2xl bg-white p-5 shadow-soft">
    <h2 className="text-xl font-bold">3. Get your card</h2>
    <p className="mt-2 text-base leading-7 text-brand-slate">{GIGCARD_PRICE_LABEL} one-time per card. Edits and repeat downloads or shares of that saved card are included after purchase.</p>
    <p className="mt-2 text-sm text-brand-slate">Preview is free. Download and share require a verified purchase. Continuing checks existing purchases first, so you do not pay twice for the same saved card.</p>
    <div className="mt-4 flex flex-wrap gap-3">{(Object.keys(CARD_ACTION_LABELS) as CardAction[]).map(key => <button type="button" key={key} disabled={!ready || busy} onClick={() => { setAction(key); setMessage(""); setPaidFile(null); dialog.current?.showModal() }} className="min-h-12 rounded-xl border border-indigo-200 px-4 py-3 text-base font-semibold text-brand-indigo disabled:opacity-50">{CARD_ACTION_LABELS[key]}</button>)}</div>
    {busy && <p role="status" className="mt-3 text-sm">Checking checkout. Please keep this page open.</p>}
    <dialog ref={dialog} aria-labelledby="card-purchase-title" onCancel={event => { if (busy) event.preventDefault() }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-brand-midnight shadow-2xl backdrop:bg-black/50">
      <h2 id="card-purchase-title" className="text-2xl font-bold">Unlock your GigCard</h2>
      <p className="mt-3 text-base">{CARD_ACTION_LABELS[action]} requires a one-time purchase.</p>
      <p className="mt-4 text-4xl font-extrabold">{GIGCARD_PRICE_LABEL}<span className="ml-2 text-base font-normal">per card</span></p>
      <p className="mt-3 text-sm leading-6 text-brand-slate">One saved card, with edits and repeat downloads/shares included. No subscription and no charge for each download.</p>
      <p className="mt-3 text-sm leading-6 text-brand-slate">Your card is saved privately before checkout. Razorpay opens only when checkout is available. Closing payment does not unlock a download.</p>
      {!paidFile && <><button type="button" disabled={busy || !ready} onClick={() => void pay()} className="mt-5 min-h-12 w-full rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Checking checkout…" : `Continue with Razorpay · ${GIGCARD_PRICE_LABEL}`}</button><button type="button" disabled={busy || !ready} onClick={() => void pay(true)} className="mt-3 min-h-11 w-full text-sm font-bold text-brand-indigo">Already paid? Restore purchase</button></>}
      {paidFile && <button type="button" onClick={async () => { if (action !== "share") { downloadCardBlob(paidFile, paidFile.name); return } try { const result = await shareCardImage(paidFile); setMessage(result === "cancelled" ? "Sharing cancelled. Your purchase is still available." : result === "downloaded" ? "PNG downloaded. Attach it in your messaging app." : "Card handed to your selected app.") } catch (error) { setMessage(error instanceof Error ? error.message : "Share failed. Try downloading your card.") } }} className="mt-4 min-h-12 w-full rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white">{action === "share" ? "Share paid card" : "Download paid card"}</button>}
      {message && <p role="status" className="mt-4 text-sm leading-6">{message}</p>}
      <button type="button" disabled={busy} onClick={() => dialog.current?.close()} className="mt-3 min-h-11 w-full rounded-xl border px-4 py-2 font-semibold disabled:opacity-50">Back to editing</button>
    </dialog>
  </section>
}
