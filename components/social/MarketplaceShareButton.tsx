"use client"

import { Repeat2, Send } from "lucide-react"
import { useState } from "react"

export default function MarketplaceShareButton({ objectType, objectId, isOwner, lockAfterShare = false }: { objectType: "job" | "project" | "service"; objectId: string; isOwner: boolean; lockAfterShare?: boolean }) {
  const [shareId, setShareId] = useState<string | null>(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState("")
  const toggle = async () => {
    setBusy(true); setNotice("")
    try {
      const response = await fetch(shareId ? `/api/social/marketplace-shares/${shareId}` : "/api/social/marketplace-shares", { method: shareId ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: shareId ? undefined : JSON.stringify({ objectType, objectId }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw Error(data?.error || "Could not update share.")
      setShareId(shareId ? null : data.share.id); setNotice(shareId ? "Repost removed." : isOwner ? "Shared to your feed." : "Reposted to your feed.")
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not update share.") } finally { setBusy(false) }
  }
  return <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={busy || (lockAfterShare && !!shareId)} onClick={toggle} className="flex items-center gap-2 rounded-xl border border-brand-borderLight bg-white px-4 py-2.5 text-sm font-semibold text-brand-slate hover:border-brand-indigo/30 hover:text-brand-indigo disabled:opacity-50">{isOwner ? <Send className="h-4 w-4" /> : <Repeat2 className="h-4 w-4" />}{shareId && lockAfterShare ? "✓ Shared to Feed" : shareId ? "Undo Repost" : isOwner ? "Share to Feed" : "Repost"}</button>{notice && <span className="text-caption text-brand-slate">{notice}</span>}</div>
}
