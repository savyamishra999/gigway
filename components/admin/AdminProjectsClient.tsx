"use client"

import { useState } from "react"
import { ExternalLink, Trash2, X, FolderOpen } from "lucide-react"

interface ProjectRow {
  id: string
  title: string
  budget: number | null
  category: string | null
  status: string | null
  created_at: string
  poster_name: string | null
  poster_email: string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function budget(amount: number | null) {
  if (!amount) return "—"
  return `₹${amount.toLocaleString()}`
}

function statusBadge(s: string | null) {
  if (s === "open")        return "bg-[#4ADE80]/10 text-[#4ADE80]"
  if (s === "in_progress") return "bg-[#FBBF24]/10 text-[#FBBF24]"
  if (s === "closed")      return "bg-[#475569]/30 text-[#94A3B8]"
  return "bg-[#1E1E2E] text-[#6B7280]"
}

export default function AdminProjectsClient({ initial }: { initial: ProjectRow[] }) {
  const [projects, setProjects] = useState(initial)
  const [target, setTarget]     = useState<ProjectRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast]       = useState("")

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const confirmDelete = async () => {
    if (!target) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/delete-project", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: target.id }),
      })
      if (res.ok) {
        setProjects(p => p.filter(x => x.id !== target.id))
        showToast("Project deleted")
        setTarget(null)
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

      {target && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-black">Delete project permanently?</h3>
              <button onClick={() => setTarget(null)} className="text-[#6B7280] hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 text-sm">
              <p className="font-bold text-red-400 truncate">{target.title}</p>
              <p className="text-red-300/70 text-xs mt-1">Posted by {target.poster_name || target.poster_email || "Unknown"}</p>
              <p className="text-red-300 text-xs mt-2">This will permanently delete the project and all related data. Cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTarget(null)}
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
        {projects.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <FolderOpen className="h-8 w-8 text-[#475569]" />
            <p className="text-[#475569] text-sm">No projects posted yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Posted By</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Budget</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-right text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white font-medium truncate max-w-[160px]">{p.title}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <p className="text-[#94A3B8] text-xs truncate max-w-[140px]">{p.poster_name || p.poster_email || "—"}</p>
                    </td>
                    <td className="px-3 py-3 text-[#94A3B8] text-xs hidden md:table-cell whitespace-nowrap">
                      {budget(p.budget)}
                      {p.category && <span className="ml-1 text-[#475569]">· {p.category}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusBadge(p.status)}`}>
                        {p.status?.replace("_", " ") || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#6B7280] text-xs hidden lg:table-cell">{fmt(p.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/projects/${p.id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1E1E2E] hover:bg-[#334155] text-[#94A3B8] hover:text-white text-xs rounded-lg transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </a>
                        <button onClick={() => setTarget(p)}
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
