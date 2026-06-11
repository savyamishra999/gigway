"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Plus, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react"

type NoticeType = "info" | "warning" | "announcement" | "new_feature"

interface Notice {
  id: string
  title: string
  content: string
  type: NoticeType
  is_active: boolean
  show_until: string | null
  created_by: string
  created_at: string
}

const TYPE_STYLES: Record<NoticeType, { bg: string; border: string; badge: string; label: string }> = {
  info:         { bg: "bg-blue-500/10",   border: "border-blue-500/30",   badge: "bg-blue-500/20 text-blue-300",     label: "Info" },
  warning:      { bg: "bg-amber-500/10",  border: "border-amber-500/30",  badge: "bg-amber-500/20 text-amber-300",   label: "Warning" },
  announcement: { bg: "bg-purple-500/10", border: "border-purple-500/30", badge: "bg-purple-500/20 text-purple-300", label: "Announcement" },
  new_feature:  { bg: "bg-green-500/10",  border: "border-green-500/30",  badge: "bg-green-500/20 text-green-300",   label: "New Feature" },
}

export default function AdminNoticesPage() {
  const [notices, setNotices]   = useState<Notice[]>([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "", content: "", type: "announcement" as NoticeType, show_until: "",
  })
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  useEffect(() => {
    fetch("/api/admin/notices/list")
      .then(r => r.json())
      .then(d => { setNotices(d.notices || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const createNotice = async () => {
    if (!form.title.trim() || !form.content.trim()) { showToast("Title and content required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, show_until: form.show_until || null }),
      })
      const d = await res.json()
      if (res.ok) {
        setNotices(n => [d.notice, ...n])
        setForm({ title: "", content: "", type: "announcement", show_until: "" })
        setShowForm(false)
        showToast("Notice posted!")
      } else {
        showToast(d.error || "Failed")
      }
    } catch { showToast("Network error") }
    setSaving(false)
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    const res = await fetch("/api/admin/notices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    })
    if (res.ok) {
      setNotices(n => n.map(x => x.id === id ? { ...x, is_active } : x))
      showToast(is_active ? "Notice activated" : "Notice deactivated")
    }
  }

  const deleteNotice = async (id: string) => {
    const res = await fetch("/api/admin/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setNotices(n => n.filter(x => x.id !== id))
      showToast("Deleted")
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-[#6B7280] hover:text-white text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#A78BFA]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Notice Board</h1>
                <p className="text-[#6B7280] text-xs mt-0.5">Post announcements to all users</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" /> New Notice
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-sm">Create Notice</h2>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Notice title..."
              className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED] placeholder:text-[#475569]"
            />
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Notice content..."
              rows={3}
              className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7C3AED] placeholder:text-[#475569] resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as NoticeType }))}
                  className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="announcement">Announcement</option>
                  <option value="new_feature">New Feature</option>
                </select>
              </div>
              <div>
                <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-1.5">Show Until (optional)</label>
                <input
                  type="date"
                  value={form.show_until}
                  onChange={e => setForm(f => ({ ...f, show_until: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-[#334155] text-[#6B7280] rounded-xl text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={createNotice} disabled={saving}
                className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40">
                {saving ? "Posting…" : "Post Notice"}
              </button>
            </div>
          </div>
        )}

        {/* Notices list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[#12121A] border border-[#1E1E2E] rounded-2xl animate-pulse" />)}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
            <Bell className="h-8 w-8 text-[#475569] mx-auto mb-3" />
            <p className="text-white font-bold">No notices yet</p>
            <p className="text-[#475569] text-sm mt-1">Create your first notice to inform users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => {
              const s = TYPE_STYLES[n.type as NoticeType] ?? TYPE_STYLES.info
              return (
                <div key={n.id} className={`${n.is_active ? s.bg : "bg-[#12121A]"} border ${n.is_active ? s.border : "border-[#1E1E2E]"} rounded-2xl p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.badge}`}>{s.label}</span>
                        {!n.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E1E2E] text-[#475569] font-bold">INACTIVE</span>}
                      </div>
                      <p className="text-white font-bold text-sm">{n.title}</p>
                      <p className="text-[#94A3B8] text-xs mt-1 line-clamp-2">{n.content}</p>
                      <p className="text-[#475569] text-xs mt-2">
                        {new Date(n.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                        {n.show_until && ` · expires ${new Date(n.show_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(n.id, !n.is_active)}
                        className={`p-2 rounded-lg border text-xs transition-colors ${
                          n.is_active
                            ? "bg-[#4ADE80]/10 border-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/20"
                            : "bg-[#1E1E2E] border-[#334155] text-[#475569] hover:text-white"
                        }`}
                        title={n.is_active ? "Deactivate" : "Activate"}
                      >
                        {n.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteNotice(n.id)}
                        className="p-2 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
