"use client"

import { useState } from "react"
import { ExternalLink, Trash2, X, Shield, ShieldOff, Ban, CheckCircle, UserCheck, Send } from "lucide-react"

interface FreelancerRow {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  skills: string[] | null
  hourly_rate: number | null
  is_verified: boolean | null
  is_boosted: boolean | null
  is_banned: boolean | null
  boost_expires_at: string | null
  created_at: string
}

export default function AdminFreelancersClient({ initial }: { initial: FreelancerRow[] }) {
  const [list, setList]         = useState(initial)
  const [deleteTarget, setDeleteTarget] = useState<FreelancerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading]   = useState<string | null>(null)
  const [toast, setToast]       = useState("")
  const [msgTarget, setMsgTarget]   = useState<FreelancerRow | null>(null)
  const [msgTitle, setMsgTitle]     = useState("")
  const [msgBody, setMsgBody]       = useState("")
  const [sendingMsg, setSendingMsg] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const sendMessage = async () => {
    if (!msgTarget || !msgTitle.trim() || !msgBody.trim()) return
    setSendingMsg(true)
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: msgTarget.id, title: msgTitle, message: msgBody }),
      })
      if (res.ok) {
        showToast(`Message sent to ${msgTarget.full_name || "user"} ✅`)
        setMsgTarget(null); setMsgTitle(""); setMsgBody("")
      } else {
        const d = await res.json()
        showToast(d.error || "Failed to send")
      }
    } catch { showToast("Network error") }
    setSendingMsg(false)
  }

  const patch = async (userId: string, updates: Record<string, unknown>, successMsg: string) => {
    setLoading(userId)
    try {
      const res = await fetch("/api/admin/freelancer-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      })
      if (res.ok) {
        setList(l => l.map(f => f.id === userId ? { ...f, ...updates } : f))
        showToast(successMsg)
      } else {
        const d = await res.json()
        showToast(d.error || "Action failed")
      }
    } catch { showToast("Network error") }
    setLoading(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      })
      if (res.ok) {
        setList(l => l.filter(f => f.id !== deleteTarget.id))
        showToast(`${deleteTarget.full_name || "User"} deleted`)
        setDeleteTarget(null)
      } else {
        const d = await res.json()
        showToast(d.error || "Delete failed")
      }
    } catch { showToast("Network error") }
    setDeleting(false)
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Personal message modal */}
      {msgTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-black text-sm">Message as GigWay <span className="text-blue-400">✅</span></h3>
                <p className="text-[#475569] text-xs mt-0.5">To: {msgTarget.full_name || msgTarget.email}</p>
              </div>
              <button onClick={() => setMsgTarget(null)} className="text-[#6B7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={msgTitle}
                onChange={e => setMsgTitle(e.target.value)}
                placeholder="Subject / Title"
                className="w-full bg-[#0F172A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
              />
              <textarea
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                placeholder="Message body..."
                rows={4}
                className="w-full bg-[#0F172A] border border-[#1E1E2E] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] resize-none"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setMsgTarget(null)}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={sendMessage} disabled={sendingMsg || !msgTitle.trim() || !msgBody.trim()}
                className="flex-1 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Send className="h-3.5 w-3.5" />
                {sendingMsg ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-black">Delete {deleteTarget.full_name || "user"} permanently?</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-[#6B7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 text-sm">
              <p className="font-bold text-red-400">{deleteTarget.full_name || "Unnamed User"}</p>
              <p className="text-red-300/70 text-xs mt-1">{deleteTarget.email}</p>
              <p className="text-red-300 text-xs mt-2">
                Removes all their gigs, jobs, projects, and account. Cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white hover:border-[#475569] transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
        {list.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <UserCheck className="h-8 w-8 text-[#475569]" />
            <p className="text-[#475569] text-sm">No freelancers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Freelancer</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Skills</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Rate</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Flags</th>
                  <th className="text-right text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {list.map(f => {
                  const busy = loading === f.id
                  const isBanned    = !!f.is_banned
                  const isVerified  = !!f.is_verified
                  return (
                    <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {f.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-bold text-sm flex-shrink-0">
                              {f.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate max-w-[130px]">{f.full_name || "—"}</p>
                            <p className="text-[#475569] text-xs truncate max-w-[130px]">{f.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap max-w-[160px]">
                          {(f.skills ?? []).slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] bg-[#1E1E2E] text-[#94A3B8] px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                          {(f.skills?.length ?? 0) > 3 && (
                            <span className="text-[10px] text-[#475569]">+{(f.skills?.length ?? 0) - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#94A3B8] text-xs hidden sm:table-cell">
                        {f.hourly_rate ? `₹${f.hourly_rate}/hr` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {isVerified && (
                            <span className="flex items-center gap-1 text-[10px] bg-[#4ADE80]/10 text-[#4ADE80] px-2 py-0.5 rounded-full font-semibold">
                              <Shield className="h-3 w-3" /> Verified
                            </span>
                          )}
                          {f.is_boosted && new Date(f.boost_expires_at ?? "") > new Date() && (
                            <span className="text-[10px] bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full font-semibold">Boosted</span>
                          )}
                          {isBanned && (
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-semibold">Banned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <a href={`/freelancers/${f.id}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1E1E2E] hover:bg-[#334155] text-[#94A3B8] hover:text-white text-xs rounded-lg transition-colors">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            disabled={busy}
                            onClick={() => patch(f.id,
                              isVerified
                                ? { is_verified: false, verification_status: "none" }
                                : { is_verified: true, verification_status: "verified" },
                              isVerified ? "Badge revoked" : "Badge granted ✅"
                            )}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 border ${
                              isVerified
                                ? "bg-[#4ADE80]/10 border-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/20"
                                : "bg-[#1E1E2E] border-[#334155] text-[#6B7280] hover:text-white hover:border-[#475569]"
                            }`}
                            title={isVerified ? "Revoke badge" : "Grant badge"}
                          >
                            {isVerified ? <ShieldOff className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => patch(f.id,
                              { is_banned: !isBanned },
                              isBanned ? "User unbanned" : "User banned"
                            )}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 border ${
                              isBanned
                                ? "bg-[#1E1E2E] border-[#334155] text-[#6B7280] hover:text-white hover:border-[#475569]"
                                : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                            }`}
                            title={isBanned ? "Unban" : "Ban"}
                          >
                            <Ban className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => { setMsgTarget(f); setMsgTitle(""); setMsgBody("") }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-[#818CF8] text-xs rounded-lg hover:bg-[#4F46E5]/20 transition-colors"
                            title="Send personal message"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(f)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
