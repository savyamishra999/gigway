"use client"

import { useState } from "react"
import { Search, Gift, CheckCircle } from "lucide-react"

interface GrantHistory {
  id: string
  grant_type: string
  note: string | null
  granted_at: string
  user_name: string | null
  user_email: string | null
}

const GRANT_TYPES = [
  { value: "verified_badge",     label: "Verified Badge ✅" },
  { value: "boost_1m",           label: "Boost — 1 Month" },
  { value: "boost_3m",           label: "Boost — 3 Months" },
  { value: "boost_6m",           label: "Boost — 6 Months" },
  { value: "affiliate_access",   label: "Affiliate Access" },
  { value: "remove_ban",         label: "Remove Ban" },
  { value: "connects_20",        label: "20 Connects" },
  { value: "connects_60",        label: "60 Connects" },
]

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default function SpecialGrantsClient({
  history: initial, adminId,
}: { history: GrantHistory[]; adminId: string }) {
  const [history, setHistory] = useState(initial)
  const [email, setEmail]     = useState("")
  const [user, setUser]       = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound]   = useState(false)
  const [grantType, setGrantType] = useState(GRANT_TYPES[0].value)
  const [note, setNote]       = useState("")
  const [granting, setGranting] = useState(false)
  const [toast, setToast]     = useState("")

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000) }

  const searchUser = async () => {
    if (!email.trim()) return
    setSearching(true)
    setNotFound(false)
    setUser(null)
    try {
      const res = await fetch(`/api/admin/find-user?email=${encodeURIComponent(email.trim())}`)
      if (res.ok) {
        const d = await res.json()
        if (d.user) setUser(d.user)
        else setNotFound(true)
      } else setNotFound(true)
    } catch { setNotFound(true) }
    setSearching(false)
  }

  const grantNow = async () => {
    if (!user) return
    setGranting(true)
    try {
      const res = await fetch("/api/admin/special-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, grantType, note, adminId }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(`Granted "${GRANT_TYPES.find(g => g.value === grantType)?.label}" to ${user.full_name} ✅`)
        setHistory(h => [{
          id: d.id || Date.now().toString(),
          grant_type: grantType,
          note: note || null,
          granted_at: new Date().toISOString(),
          user_name: user.full_name,
          user_email: user.email,
        }, ...h])
        setNote("")
      } else {
        showToast(d.error || "Grant failed")
      }
    } catch { showToast("Network error") }
    setGranting(false)
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Grant form */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-black text-lg">Grant to User</h2>

        {/* Search by email */}
        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">User Email</label>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={e => { setEmail(e.target.value); setUser(null); setNotFound(false) }}
              onKeyDown={e => e.key === "Enter" && searchUser()}
              placeholder="user@example.com"
              className="flex-1 bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
            />
            <button
              onClick={searchUser}
              disabled={searching || !email.trim()}
              className="px-4 py-2.5 bg-[#1E1E2E] hover:bg-[#334155] border border-[#334155] text-[#94A3B8] hover:text-white text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {searching ? "…" : "Find"}
            </button>
          </div>
          {notFound && <p className="text-red-400 text-xs mt-2">No user found with that email.</p>}
        </div>

        {/* Found user */}
        {user && (
          <div className="bg-[#0F172A] border border-[#4ADE80]/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-black flex-shrink-0">
              {user.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold">{user.full_name}</p>
              <p className="text-[#6B7280] text-xs">{user.email}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-[#4ADE80] flex-shrink-0 ml-auto" />
          </div>
        )}

        {/* Grant type */}
        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">Grant Type</label>
          <select
            value={grantType}
            onChange={e => setGrantType(e.target.value)}
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5]"
          >
            {GRANT_TYPES.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Internal note */}
        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">
            Internal Note <span className="text-[#475569] font-normal">(optional)</span>
          </label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Compensating for bug, contest winner..."
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
        </div>

        <button
          onClick={grantNow}
          disabled={!user || granting}
          className="w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-black text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Gift className="h-4 w-4" />
          {granting ? "Granting…" : "Grant Now"}
        </button>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-white font-black text-lg">Grant History</h2>
        {history.length === 0 ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-10 text-center">
            <p className="text-[#475569] text-sm">No grants issued yet</p>
          </div>
        ) : (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">User</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Grant</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Note</th>
                    <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E2E]">
                  {history.map(g => (
                    <tr key={g.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <p className="text-white text-xs font-medium">{g.user_name || "—"}</p>
                        <p className="text-[#475569] text-xs">{g.user_email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] bg-[#4F46E5]/10 text-[#818CF8] px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                          {GRANT_TYPES.find(t => t.value === g.grant_type)?.label ?? g.grant_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#6B7280] text-xs hidden md:table-cell max-w-[160px] truncate">
                        {g.note || "—"}
                      </td>
                      <td className="px-3 py-3 text-[#475569] text-xs hidden sm:table-cell whitespace-nowrap">
                        {fmt(g.granted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
