"use client"

import { useState } from "react"
import { CheckCircle, Ban, Trash2, ExternalLink } from "lucide-react"

export interface EmployerRow {
  id: string
  full_name: string | null
  email: string | null
  company_name: string | null
  company_size: string | null
  account_type: string | null
  is_employer_verified: boolean | null
  is_banned: boolean | null
  plan: string | null
  plan_expires_at: string | null
  jobs_count: number
  created_at: string
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function planBadge(plan: string | null, expires: string | null) {
  if (plan === "hire_talent" && expires && new Date(expires) > new Date()) {
    return <span className="text-[9px] bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 px-2 py-0.5 rounded-full font-bold">Active</span>
  }
  return <span className="text-[9px] bg-[#1E1E2E] text-[#475569] border border-[#334155] px-2 py-0.5 rounded-full font-bold">No Plan</span>
}

export default function AdminEmployersClient({ initial }: { initial: EmployerRow[] }) {
  const [employers, setEmployers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<EmployerRow | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const action = async (id: string, act: string) => {
    setLoading(id + act)
    try {
      const res = await fetch("/api/admin/employers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: act }),
      })
      const data = await res.json()
      if (res.ok) {
        if (act === "verify") {
          setEmployers(prev => prev.map(e => e.id === id ? { ...e, is_employer_verified: true } : e))
          showToast("Company verified ✅")
        } else if (act === "ban") {
          setEmployers(prev => prev.map(e => e.id === id ? { ...e, is_banned: true } : e))
          showToast("User banned")
        } else if (act === "unban") {
          setEmployers(prev => prev.map(e => e.id === id ? { ...e, is_banned: false } : e))
          showToast("User unbanned")
        }
      } else {
        showToast(data.error || "Failed")
      }
    } catch {
      showToast("Network error")
    }
    setLoading(null)
  }

  const doDelete = async (id: string) => {
    setLoading(id + "delete")
    try {
      const res = await fetch("/api/admin/employers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setEmployers(prev => prev.filter(e => e.id !== id))
        showToast("Employer deleted")
      } else {
        showToast("Failed to delete")
      }
    } catch {
      showToast("Network error")
    }
    setLoading(null)
    setConfirmDelete(null)
  }

  if (employers.length === 0) {
    return (
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
        <p className="text-white font-bold">No employers found</p>
        <p className="text-[#475569] text-sm mt-1">Try a different filter</p>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1A1A2E] border border-[#334155] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-black text-lg mb-2">Delete Employer?</h3>
            <p className="text-[#94A3B8] text-sm mb-5">
              <strong className="text-white">{confirmDelete.full_name || confirmDelete.email}</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDelete.id)}
                disabled={!!loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E1E2E]">
              {["Name / Company", "Type", "Plan", "Jobs Posted", "Joined", "Actions"].map(h => (
                <th key={h} className="text-left text-[#475569] text-xs font-semibold uppercase tracking-wide px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E1E2E]">
            {employers.map(emp => (
              <tr key={emp.id} className={`hover:bg-white/[0.02] transition-colors ${emp.is_banned ? "opacity-50" : ""}`}>
                <td className="px-5 py-3.5">
                  <p className="text-white font-medium">{emp.full_name || "—"}</p>
                  <p className="text-[#475569] text-xs">{emp.email}</p>
                  {emp.company_name && <p className="text-[#818CF8] text-xs mt-0.5">{emp.company_name}</p>}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {emp.is_employer_verified && (
                      <span className="text-[9px] bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 px-1.5 py-0.5 rounded-full font-bold">Verified ✅</span>
                    )}
                    {emp.is_banned && (
                      <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">Banned</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[#94A3B8] text-xs capitalize">{emp.account_type || "individual"}</span>
                  {emp.company_size && <p className="text-[#475569] text-xs">{emp.company_size}</p>}
                </td>
                <td className="px-5 py-3.5">
                  {planBadge(emp.plan, emp.plan_expires_at)}
                  {emp.plan_expires_at && new Date(emp.plan_expires_at) > new Date() && (
                    <p className="text-[#475569] text-xs mt-1">Exp: {fmt(emp.plan_expires_at)}</p>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-white font-bold">{emp.jobs_count}</span>
                </td>
                <td className="px-5 py-3.5 text-[#6B7280] text-xs whitespace-nowrap">
                  {fmt(emp.created_at)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <a href={`/admin/users?q=${encodeURIComponent(emp.email ?? "")}`}
                      className="p-1.5 rounded-lg bg-[#4F46E5]/10 text-[#818CF8] hover:bg-[#4F46E5]/20 transition-colors"
                      title="View in users">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {!emp.is_employer_verified && (
                      <button
                        onClick={() => action(emp.id, "verify")}
                        disabled={loading === emp.id + "verify"}
                        className="p-1.5 rounded-lg bg-[#4ADE80]/10 text-[#4ADE80] hover:bg-[#4ADE80]/20 transition-colors disabled:opacity-40"
                        title="Verify company">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => action(emp.id, emp.is_banned ? "unban" : "ban")}
                      disabled={loading === emp.id + (emp.is_banned ? "unban" : "ban")}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                        emp.is_banned
                          ? "bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20"
                          : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      }`}
                      title={emp.is_banned ? "Unban" : "Ban"}>
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(emp)}
                      disabled={!!loading}
                      className="p-1.5 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-colors disabled:opacity-40"
                      title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {employers.map(emp => (
          <div key={emp.id} className={`bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 space-y-3 ${emp.is_banned ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-bold text-sm">{emp.full_name || "—"}</p>
                <p className="text-[#475569] text-xs">{emp.email}</p>
                {emp.company_name && <p className="text-[#818CF8] text-xs mt-0.5">{emp.company_name}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                {planBadge(emp.plan, emp.plan_expires_at)}
                {emp.is_employer_verified && (
                  <span className="text-[9px] bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 px-1.5 py-0.5 rounded-full font-bold">Verified ✅</span>
                )}
                {emp.is_banned && (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">Banned</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#6B7280]">
              <span>{emp.jobs_count} jobs</span>
              <span className="capitalize">{emp.account_type || "individual"}</span>
              <span>{fmt(emp.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              {!emp.is_employer_verified && (
                <button onClick={() => action(emp.id, "verify")} disabled={loading === emp.id + "verify"}
                  className="flex-1 py-2 text-xs font-semibold bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 rounded-xl disabled:opacity-40">
                  Verify ✅
                </button>
              )}
              <button
                onClick={() => action(emp.id, emp.is_banned ? "unban" : "ban")}
                disabled={!!loading}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border disabled:opacity-40 ${
                  emp.is_banned
                    ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                {emp.is_banned ? "Unban" : "Ban"}
              </button>
              <button onClick={() => setConfirmDelete(emp)} disabled={!!loading}
                className="py-2 px-3 text-xs font-semibold bg-red-900/20 text-red-500 border border-red-900/30 rounded-xl disabled:opacity-40">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
