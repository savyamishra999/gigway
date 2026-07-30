"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Trash2, Eye, X, ShieldCheck } from "lucide-react"

interface Pending {
  id: string
  full_name:             string | null
  email:                 string | null
  phone:                 string | null
  aadhaar_front_url:     string | null
  aadhaar_back_url:      string | null
  verification_paid_at:  string | null
  verification_doc:      string | null
  account_type:          string | null
  user_roles:            string[] | null
  find_work_type:        string | null
  hire_talent_type:      string | null
  created_at:            string
  frontUrl:              string | null
  backUrl:               string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return "just now"
}

function getRoleLabel(p: Pending): { label: string; color: string } {
  const roles = (p.user_roles ?? []) as string[]
  const isCompany = p.account_type === "company" || p.hire_talent_type === "company"
  if (isCompany) return { label: "Company", color: "bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30" }
  if (roles.includes("find_work") && p.find_work_type === "job_seeker")
    return { label: "Job Seeker", color: "bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/30" }
  if (!roles.includes("find_work") && p.hire_talent_type === "individual")
    return { label: "Individual Client", color: "bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30" }
  return { label: "Freelancer", color: "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30" }
}

function getDocInfo(p: Pending): { docLabel: string; extraInfo: string | null } {
  const doc = p.verification_doc ?? ""
  if (doc.startsWith("company:")) {
    return { docLabel: doc.replace("company:", ""), extraInfo: null }
  }
  if (doc.startsWith("linkedin:")) {
    return { docLabel: "Aadhaar (front + back)", extraInfo: `LinkedIn: ${doc.replace("linkedin:", "")}` }
  }
  if (doc.startsWith("aadhaar:")) {
    return { docLabel: "Aadhaar (front + back)", extraInfo: `Last 4 digits: ****${doc.replace("aadhaar:", "")}` }
  }
  const isCompany = p.account_type === "company" || p.hire_talent_type === "company"
  return { docLabel: isCompany ? "Company Document" : "Aadhaar (front + back)", extraInfo: null }
}

export default function VerificationReviewList({ pending: initial }: { pending: Pending[] }) {
  const [list,        setList]        = useState(initial)
  const [loading,     setLoading]     = useState<string | null>(null)
  const [lightbox,    setLightbox]    = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionError, setActionError]   = useState<string | null>(null)

  const action = async (userId: string, act: "approve" | "reject" | "delete", reason?: string) => {
    setLoading(userId + act)
    setActionError(null)
    try {
      const res = await fetch("/api/admin/verify-freelancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: act, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setList(l => l.filter(p => p.id !== userId))
        setRejectModal(null)
        setDeleteModal(null)
        setRejectReason("")
      } else {
        setActionError(data.error || `Failed (${res.status})`)
      }
    } catch {
      setActionError("Network error — please try again")
    }
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}>
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Document" className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold mb-1">Reject Verification</h3>
            <p className="text-[#6B7280] text-xs mb-4">{rejectModal.name} will be notified.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason (e.g. 'Documents unclear — please resubmit')"
              rows={3}
              className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason("") }}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={() => action(rejectModal.id, "reject", rejectReason)}
                disabled={!!loading}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                {loading ? "…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold mb-1">Delete Request</h3>
            <p className="text-[#6B7280] text-xs mb-4">
              This will reset <strong className="text-white">{deleteModal.name}&apos;s</strong> verification status and remove their documents.
              They can resubmit from scratch.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={() => action(deleteModal.id, "delete")}
                disabled={!!loading}
                className="flex-1 py-2.5 bg-red-900/30 border border-red-700/40 text-red-400 rounded-xl text-sm font-bold hover:bg-red-900/50 transition-colors disabled:opacity-50">
                {loading ? "…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-red-400 text-sm">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-4">
        {list.map(p => {
          const role    = getRoleLabel(p)
          const docInfo = getDocInfo(p)
          const isCompany = p.account_type === "company" || p.hire_talent_type === "company"

          return (
            <div key={p.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-[#1E1E2E] gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold">{p.full_name || "Unnamed"}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.color}`}>
                      {role.label}
                    </span>
                  </div>
                  <p className="text-[#6B7280] text-xs">{p.email}</p>
                  {p.phone && <p className="text-[#475569] text-xs">{p.phone}</p>}
                  <p className="text-[#475569] text-xs">
                    Doc: <span className="text-[#94A3B8]">{docInfo.docLabel}</span>
                  </p>
                  {docInfo.extraInfo && (
                    <p className="text-[#475569] text-xs">
                      {docInfo.extraInfo.startsWith("LinkedIn:")
                        ? <>LinkedIn: <a href={docInfo.extraInfo.replace("LinkedIn: ", "")} target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:underline truncate">View Profile →</a></>
                        : <span className="text-[#94A3B8]">{docInfo.extraInfo}</span>
                      }
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {p.verification_paid_at && (
                    <p className="text-[#4ADE80] text-xs font-semibold">✅ Paid on {fmt(p.verification_paid_at)}</p>
                  )}
                  <p className="text-[#475569] text-xs mt-0.5">Submitted {timeAgo(p.created_at)}</p>
                </div>
              </div>

              {/* Document previews */}
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                {[
                  { label: isCompany ? docInfo.docLabel : "Aadhaar Front", url: p.frontUrl },
                  { label: isCompany ? "Same document" :  "Aadhaar Back",  url: p.backUrl  },
                ].map(({ label, url }) => (
                  <div key={label}>
                    <p className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
                    {url ? (
                      <button type="button" onClick={() => setLightbox(url)}
                        className="relative w-full aspect-video bg-[#0F172A] border border-[#334155] rounded-xl overflow-hidden hover:border-[#4F46E5]/50 transition-colors group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={label} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-full aspect-video bg-[#0F172A] border border-[#334155] rounded-xl flex items-center justify-center">
                        <p className="text-[#475569] text-xs">No file</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-5 pb-5">
                <button onClick={() => action(p.id, "approve")}
                  disabled={loading === p.id + "approve"}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] font-bold text-sm rounded-xl hover:bg-[#4ADE80]/20 transition-colors disabled:opacity-50">
                  <CheckCircle className="h-4 w-4" />
                  {loading === p.id + "approve" ? "…" : "Approve"}
                </button>
                <button onClick={() => setRejectModal({ id: p.id, name: p.full_name || "User" })}
                  disabled={!!loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button onClick={() => setDeleteModal({ id: p.id, name: p.full_name || "User" })}
                  disabled={!!loading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1E1E2E] border border-[#334155] text-[#6B7280] hover:text-red-400 hover:border-red-500/30 text-sm rounded-xl transition-colors disabled:opacity-50"
                  title="Delete request">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
