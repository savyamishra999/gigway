"use client"
import { useRef, useState } from "react"
import { boundedFetch } from "@/lib/async"

export default function ModerationReviewActions({ id }: { id: string }) {
  const [status, setStatus] = useState("open"), [busy, setBusy] = useState(false), [error, setError] = useState("")
  const inFlight = useRef(false)
  const review = async (next: "reviewed" | "dismissed") => {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError("")
    try {
      const response = await boundedFetch(`/api/admin/reports/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) })
      const data = await response.json()
      if (!response.ok || !["reviewed", "dismissed"].includes(data.status)) throw new Error(data.error || "The review could not be saved.")
      setStatus(data.status)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The review could not be saved.") }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <div className="mt-3 space-y-2">{status === "open" ? <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => void review("reviewed")} className="min-h-11 rounded-lg border border-indigo-400 px-3 py-2 text-sm text-indigo-300 disabled:opacity-50">Mark reviewed</button><button type="button" disabled={busy} onClick={() => void review("dismissed")} className="min-h-11 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 disabled:opacity-50">Dismiss report</button></div> : <p role="status" className="text-sm text-slate-300">Report {status}.</p>}{error && <p role="alert" className="text-sm text-red-300">{error}</p>}</div>
}
