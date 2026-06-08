"use client"

import { useState } from "react"
import { ExternalLink, Trash2, X, FileText } from "lucide-react"

interface GigRow {
  id: string
  title: string
  price: number | null
  category: string | null
  delivery_days: number | null
  status: string | null
  created_at: string
  seller_name: string | null
  seller_email: string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default function AdminGigsClient({ initial }: { initial: GigRow[] }) {
  const [gigs, setGigs]     = useState(initial)
  const [target, setTarget] = useState<GigRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast]   = useState("")

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const confirmDelete = async () => {
    if (!target) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/delete-gig", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: target.id }),
      })
      if (res.ok) {
        setGigs(g => g.filter(x => x.id !== target.id))
        showToast("Gig deleted")
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
              <h3 className="text-white font-black">Delete gig permanently?</h3>
              <button onClick={() => setTarget(null)} className="text-[#6B7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 text-sm">
              <p className="font-bold text-red-400 truncate">{target.title}</p>
              <p className="text-red-300/70 text-xs mt-1">By {target.seller_name || target.seller_email || "Unknown"}</p>
              <p className="text-red-300 text-xs mt-2">Permanently deletes this gig. Cannot be undone.</p>
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
        {gigs.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <FileText className="h-8 w-8 text-[#475569]" />
            <p className="text-[#475569] text-sm">No gigs posted yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Seller</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Price</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-right text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {gigs.map(g => (
                  <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white font-medium truncate max-w-[160px]">{g.title}</p>
                      <p className="text-[#475569] text-xs sm:hidden">{g.seller_name || g.seller_email || "—"}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <p className="text-[#94A3B8] text-xs truncate max-w-[140px]">{g.seller_name || g.seller_email || "—"}</p>
                    </td>
                    <td className="px-3 py-3 text-[#4ADE80] font-semibold text-xs">
                      {g.price ? `₹${g.price.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-[#94A3B8] text-xs hidden md:table-cell capitalize">
                      {g.category || "—"}
                    </td>
                    <td className="px-3 py-3 text-[#6B7280] text-xs hidden lg:table-cell">{fmt(g.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/gigs/${g.id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1E1E2E] hover:bg-[#334155] text-[#94A3B8] hover:text-white text-xs rounded-lg transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </a>
                        <button onClick={() => setTarget(g)}
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
