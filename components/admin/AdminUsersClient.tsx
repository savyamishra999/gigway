"use client"

import { useState } from "react"
import { Shield, Zap, ExternalLink, Trash2, X } from "lucide-react"

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  is_boosted: boolean | null
  is_verified: boolean | null
  verification_status: string | null
  boost_expires_at: string | null
  subscription_tier: string | null
  user_roles: string[] | null
  find_work_type: string | null
  hire_talent_type: string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function RoleChip({ user }: { user: UserRow }) {
  const roles  = user.user_roles ?? []
  const isFW   = roles.includes("find_work")
  const isHT   = roles.includes("hire_talent")
  const fwType = user.find_work_type
  const htType = user.hire_talent_type

  const chips: { label: string; color: string }[] = []

  if (isFW) {
    if (fwType === "freelancer" || fwType === "both")
      chips.push({ label: "Freelancer", color: "bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30" })
    if (fwType === "job_seeker" || fwType === "both")
      chips.push({ label: "Job Seeker", color: "bg-[#378ADD]/20 text-[#93C5FD] border border-[#378ADD]/30" })
    if (!fwType)
      chips.push({ label: "Find Work", color: "bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20" })
  }
  if (isHT) {
    if (htType === "company")
      chips.push({ label: "Company", color: "bg-[#F97316]/20 text-[#FCA5A5] border border-[#F97316]/30" })
    else if (htType === "individual")
      chips.push({ label: "Individual", color: "bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/30" })
    else
      chips.push({ label: "Hire Talent", color: "bg-[#F59E0B]/10 text-[#FCD34D] border border-[#F59E0B]/20" })
  }

  if (chips.length === 0) return <span className="text-[#475569] text-[10px]">—</span>

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map(c => (
        <span key={c.label} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.color}`}>
          {c.label}
        </span>
      ))}
    </div>
  )
}

export default function AdminUsersClient({ initial }: { initial: UserRow[] }) {
  const [users, setUsers] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [target, setTarget]     = useState<UserRow | null>(null)
  const [toast, setToast]       = useState("")

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const confirmDelete = async () => {
    if (!target) return
    setDeleting(target.id)
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      })
      if (res.ok) {
        setUsers(u => u.filter(x => x.id !== target.id))
        showToast(`${target.full_name || "User"} deleted`)
        setTarget(null)
      } else {
        const d = await res.json()
        showToast(d.error || "Delete failed")
      }
    } catch {
      showToast("Network error")
    }
    setDeleting(null)
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {target && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-black">Delete user permanently?</h3>
              <button onClick={() => setTarget(null)} className="text-[#6B7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 text-sm text-red-300 space-y-1">
              <p className="font-bold text-red-400">{target.full_name || "Unnamed User"}</p>
              <p className="text-xs text-red-300/70">{target.email}</p>
              <p className="text-xs mt-2 text-red-300">
                Removes all their gigs, jobs, projects, and account. Cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTarget(null)}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white hover:border-[#475569] transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={!!deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="text-[#475569] text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">User</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Email / Phone</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="text-right text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-bold text-sm flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[120px]">{u.full_name || "—"}</p>
                          <p className="text-[#475569] text-xs sm:hidden truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#94A3B8] hidden sm:table-cell">
                      <span className="truncate max-w-[180px] block text-xs">{u.email}</span>
                      {u.phone && <span className="text-[#475569] text-xs block">{u.phone}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <RoleChip user={u} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {u.is_boosted && new Date(u.boost_expires_at ?? "") > new Date() && (
                          <span className="flex items-center gap-1 text-[10px] bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full font-semibold">
                            <Zap className="h-3 w-3" /> Boosted
                          </span>
                        )}
                        {u.is_verified && (
                          <span className="flex items-center gap-1 text-[10px] bg-[#4ADE80]/10 text-[#4ADE80] px-2 py-0.5 rounded-full font-semibold">
                            <Shield className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {u.verification_status === "pending" && (
                          <span className="text-[10px] bg-[#FBBF24]/10 text-[#FBBF24] px-2 py-0.5 rounded-full font-semibold">Pending</span>
                        )}
                        {!u.is_boosted && !u.is_verified && u.verification_status !== "pending" && (
                          <span className="text-[10px] text-[#475569]">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#6B7280] text-xs hidden md:table-cell">
                      {fmt(u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/freelancers/${u.id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1E1E2E] hover:bg-[#334155] text-[#94A3B8] hover:text-white text-xs rounded-lg transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </a>
                        <button onClick={() => setTarget(u)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20">
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
