"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react"

export interface AppRow {
  id: string
  status: string
  cover_letter: string
  resume_url: string | null
  expected_salary: number | null
  created_at: string
  applicant_name: string | null
  applicant_email: string | null
  job_title: string | null
  company_name: string | null
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  applied:     { label: "Applied",     color: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",   dot: "🟡" },
  reviewing:   { label: "Reviewing",   color: "bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30",   dot: "🔵" },
  shortlisted: { label: "Shortlisted", color: "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30",   dot: "🟣" },
  interview:   { label: "Interview",   color: "bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/30",   dot: "🟠" },
  selected:    { label: "Selected",    color: "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30",   dot: "✅" },
  rejected:    { label: "Rejected",    color: "bg-red-500/15 text-red-400 border-red-500/30",          dot: "❌" },
}

const STATUSES = Object.keys(STATUS_META)

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default function AdminApplicationsClient({ initial }: { initial: AppRow[] }) {
  const [apps, setApps] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const changeStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
        showToast(`Status → ${STATUS_META[status]?.label}`)
      } else {
        showToast("Failed to update status")
      }
    } catch {
      showToast("Network error")
    }
    setUpdating(null)
  }

  const deleteApp = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch("/api/admin/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setApps(prev => prev.filter(a => a.id !== id))
        showToast("Application deleted")
      } else {
        showToast("Failed to delete")
      }
    } catch {
      showToast("Network error")
    }
    setDeleting(null)
  }

  if (apps.length === 0) {
    return (
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
        <p className="text-white font-bold">No applications found</p>
        <p className="text-[#475569] text-sm mt-1">Try a different filter or search term</p>
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

      {/* Desktop table */}
      <div className="hidden md:block bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E1E2E]">
              {["Applicant", "Job / Company", "Status", "Applied", "Actions"].map(h => (
                <th key={h} className="text-left text-[#475569] text-xs font-semibold uppercase tracking-wide px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E1E2E]">
            {apps.map(app => {
              const meta = STATUS_META[app.status] ?? STATUS_META.applied
              const isExpanded = expanded === app.id
              return (
                <>
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{app.applicant_name || "—"}</p>
                      <p className="text-[#475569] text-xs">{app.applicant_email || ""}</p>
                      {app.expected_salary && (
                        <p className="text-[#6B7280] text-xs mt-0.5">Exp: ₹{app.expected_salary.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{app.job_title || "—"}</p>
                      <p className="text-[#475569] text-xs">{app.company_name || ""}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={app.status}
                        disabled={updating === app.id}
                        onChange={e => changeStatus(app.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-transparent cursor-pointer disabled:opacity-50 ${meta.color}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s} className="bg-[#12121A] text-white">
                            {STATUS_META[s].dot} {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] text-xs whitespace-nowrap">
                      {fmt(app.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : app.id)}
                          className="flex items-center gap-1 text-xs text-[#818CF8] hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          Letter
                        </button>
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#4ADE80] hover:text-white transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" /> CV
                          </a>
                        )}
                        <button
                          onClick={() => deleteApp(app.id)}
                          disabled={deleting === app.id}
                          className="p-1 text-red-500 hover:text-red-400 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${app.id}-cover`} className="bg-[#0F172A]">
                      <td colSpan={5} className="px-5 py-4">
                        <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">Cover Letter</p>
                        <p className="text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {apps.map(app => {
          const meta = STATUS_META[app.status] ?? STATUS_META.applied
          const isExpanded = expanded === app.id
          return (
            <div key={app.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm">{app.applicant_name || "—"}</p>
                  <p className="text-[#475569] text-xs">{app.applicant_email || ""}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border flex-shrink-0 ${meta.color}`}>
                  {meta.dot} {meta.label}
                </span>
              </div>
              <div>
                <p className="text-[#94A3B8] text-xs">{app.job_title || "—"}</p>
                <p className="text-[#475569] text-xs">{app.company_name || ""} · {fmt(app.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={app.status}
                  disabled={updating === app.id}
                  onChange={e => changeStatus(app.id, e.target.value)}
                  className="text-xs bg-[#0F172A] border border-[#334155] text-white rounded-lg px-2 py-1.5 disabled:opacity-50"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_META[s].dot} {STATUS_META[s].label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setExpanded(isExpanded ? null : app.id)}
                  className="text-xs text-[#818CF8] hover:text-white transition-colors flex items-center gap-1"
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Letter
                </button>
                {app.resume_url && (
                  <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#4ADE80] flex items-center gap-1">
                    <Download className="h-3 w-3" /> CV
                  </a>
                )}
                <button onClick={() => deleteApp(app.id)} disabled={deleting === app.id}
                  className="p-1 text-red-500 hover:text-red-400 disabled:opacity-40 ml-auto">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {isExpanded && (
                <div className="bg-[#0F172A] rounded-xl p-3">
                  <p className="text-[#94A3B8] text-xs font-semibold mb-1.5">Cover Letter</p>
                  <p className="text-[#CBD5E1] text-xs leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
