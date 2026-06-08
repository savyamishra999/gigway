"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Eye, X, ShieldCheck } from "lucide-react"

interface Pending {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  aadhaar_front_url: string | null
  aadhaar_back_url:  string | null
  verification_paid_at: string | null
  created_at: string
  frontUrl: string | null
  backUrl:   string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return "just now"
}

export default function VerificationReviewList({ pending: initial }: { pending: Pending[] }) {
  const [list, setList] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const action = async (userId: string, act: "approve" | "reject", reason?: string) => {
    setLoading(userId + act)
    try {
      const res = await fetch("/api/admin/verify-freelancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: act, reason }),
      })
      if (res.ok) {
        setList(l => l.filter(p => p.id !== userId))
        setRejectModal(null)
        setRejectReason("")
      }
    } catch { /* ignore */ }
    setLoading(null)
  }

  if (list.length === 0) {
    return (
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="h-6 w-6 text-[#4ADE80]" />
        </div>
        <p className="text-white font-bold">All clear!</p>
        <p className="text-[#475569] text-sm mt-1">No pending verifications</p>
      </div>
    )
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Aadhaar document"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold mb-1">Reject Verification</h3>
            <p className="text-[#6B7280] text-xs mb-4">
              {rejectModal.name} will be notified with this reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (e.g. 'Documents unclear — please resubmit')"
              rows={3}
              className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason("") }}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white hover:border-[#475569] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => action(rejectModal.id, "reject", rejectReason)}
                disabled={!!loading}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {list.map(p => (
          <div key={p.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-[#1E1E2E] gap-4 flex-wrap">
              <div>
                <p className="text-white font-bold">{p.full_name || "Unnamed User"}</p>
                <p className="text-[#6B7280] text-xs mt-0.5">{p.email}</p>
                {p.phone && <p className="text-[#475569] text-xs">{p.phone}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {p.verification_paid_at && (
                  <p className="text-[#4ADE80] text-xs font-semibold">
                    ✅ Paid ₹299 on {fmt(p.verification_paid_at)}
                  </p>
                )}
                <p className="text-[#475569] text-xs mt-0.5">Submitted {timeAgo(p.created_at)}</p>
              </div>
            </div>

            {/* Document previews */}
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {[
                { label: "Aadhaar Front", url: p.frontUrl },
                { label: "Aadhaar Back",  url: p.backUrl  },
              ].map(({ label, url }) => (
                <div key={label}>
                  <p className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
                  {url ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="relative w-full aspect-video bg-[#0F172A] border border-[#334155] rounded-xl overflow-hidden hover:border-[#4F46E5]/50 transition-colors group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={label}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-full aspect-video bg-[#0F172A] border border-[#334155] rounded-xl flex items-center justify-center">
                      <p className="text-[#475569] text-xs">No file uploaded</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => action(p.id, "approve")}
                disabled={loading === p.id + "approve"}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] font-bold text-sm rounded-xl hover:bg-[#4ADE80]/20 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {loading === p.id + "approve" ? "Approving…" : "Approve ✅"}
              </button>
              <button
                onClick={() => setRejectModal({ id: p.id, name: p.full_name || "User" })}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject ❌
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
