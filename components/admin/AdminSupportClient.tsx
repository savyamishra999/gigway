"use client"

import { useState } from "react"
import { MessageCircle, Mail, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Send } from "lucide-react"

interface Ticket {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
  user_id?: string | null
  admin_reply?: string | null
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

type Tab = "open" | "urgent" | "closed"

export default function AdminSupportClient({
  open: initialOpen,
  urgent: initialUrgent,
  closed: initialClosed,
}: { open: Ticket[]; urgent: Ticket[]; closed: Ticket[] }) {
  const [tab, setTab]       = useState<Tab>("open")
  const [open, setOpen]     = useState(initialOpen)
  const [urgent, setUrgent] = useState(initialUrgent)
  const [closed, setClosed] = useState(initialClosed)
  const [loading, setLoading]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replying, setReplying] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [toast, setToast]       = useState("")

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const updateStatus = async (ticketId: string, newStatus: string, from: Tab) => {
    setLoading(ticketId)
    try {
      const res = await fetch("/api/admin/support-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      })
      if (res.ok) {
        const ticket = (from === "open" ? open : from === "urgent" ? urgent : closed)
          .find(t => t.id === ticketId)
        if (!ticket) return

        if (from === "open") setOpen(t => t.filter(x => x.id !== ticketId))
        else if (from === "urgent") setUrgent(t => t.filter(x => x.id !== ticketId))
        else setClosed(t => t.filter(x => x.id !== ticketId))

        const updated = { ...ticket, status: newStatus }
        if (newStatus === "in_progress") setUrgent(t => [updated, ...t])
        else if (newStatus === "resolved") setClosed(t => [updated, ...t])
        else if (newStatus === "open") setOpen(t => [updated, ...t])

        showToast("Ticket updated")
      }
    } catch { showToast("Network error") }
    setLoading(null)
  }

  const whatsapp = (ticket: Ticket) => {
    const msg = encodeURIComponent(
      `Hi ${ticket.name}, regarding your support ticket "${ticket.subject}" — we're looking into it and will get back to you shortly. — GigWay Team`
    )
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  const emailReply = (ticket: Ticket) => {
    window.open(
      `mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}&body=${encodeURIComponent(`Hi ${ticket.name},\n\nThank you for reaching out.\n\n`)}`,
      "_blank"
    )
  }

  const sendReply = async (ticket: Ticket) => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch("/api/admin/support-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, reply: replyText }),
      })
      if (res.ok) {
        const allLists = [open, urgent, closed]
        allLists.forEach((lst, idx) => {
          const found = lst.find(t => t.id === ticket.id)
          if (found) {
            const updated = { ...found, admin_reply: replyText, status: "resolved" }
            if (idx === 0) { setOpen(l => l.map(t => t.id === ticket.id ? updated : t)) }
            else if (idx === 1) { setUrgent(l => l.map(t => t.id === ticket.id ? updated : t)) }
            else { setClosed(l => l.map(t => t.id === ticket.id ? updated : t)) }
          }
        })
        showToast("Reply sent via GigWay ✅")
        setReplying(null)
        setReplyText("")
      } else {
        const d = await res.json()
        showToast(d.error || "Reply failed")
      }
    } catch { showToast("Network error") }
    setSendingReply(false)
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "open",   label: "Open",        count: open.length   },
    { key: "urgent", label: "In Progress", count: urgent.length },
    { key: "closed", label: "Closed",      count: closed.length },
  ]

  const current = tab === "open" ? open : tab === "urgent" ? urgent : closed

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === t.key
                ? "bg-[#4F46E5] text-white"
                : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20" : "bg-[#1E1E2E] text-[#94A3B8]"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {current.length === 0 ? (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
          <CheckCircle className="h-8 w-8 text-[#4ADE80] mx-auto mb-3" />
          <p className="text-white font-bold">All clear!</p>
          <p className="text-[#475569] text-sm mt-1">No {tab} tickets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {current.map(t => (
            <div key={t.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
              {/* Header row */}
              <div className="flex items-start justify-between px-5 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <span className="text-[#475569] text-xs">{t.email}</span>
                    <span className="text-[#334155] text-xs">·</span>
                    <span className="text-[#475569] text-xs">{timeAgo(t.created_at)}</span>
                  </div>
                  <p className="text-[#94A3B8] text-sm mt-1 font-medium">{t.subject}</p>
                </div>
                <button
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="text-[#475569] hover:text-white flex-shrink-0 mt-1"
                >
                  {expanded === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Expanded message */}
              {expanded === t.id && (
                <div className="px-5 pb-4 border-t border-[#1E1E2E] pt-4 space-y-3">
                  <p className="text-[#94A3B8] text-sm whitespace-pre-wrap">{t.message}</p>
                  {t.admin_reply && (
                    <div className="bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-xl p-3">
                      <p className="text-[#818CF8] text-xs font-bold mb-1">
                        GigWay <span className="text-blue-400">✅</span> replied:
                      </p>
                      <p className="text-[#CBD5E1] text-sm whitespace-pre-wrap">{t.admin_reply}</p>
                    </div>
                  )}
                  {replying === t.id && (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply... (sent as GigWay ✅)"
                        rows={3}
                        className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendReply(t)}
                          disabled={sendingReply || !replyText.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white text-xs font-bold rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-40"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {sendingReply ? "Sending…" : "Send Reply"}
                        </button>
                        <button
                          onClick={() => { setReplying(null); setReplyText("") }}
                          className="px-4 py-2 bg-[#1E1E2E] border border-[#334155] text-[#6B7280] text-xs rounded-lg hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
                <button
                  onClick={() => { setExpanded(t.id); setReplying(t.id); setReplyText("") }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-[#818CF8] text-xs rounded-lg hover:bg-[#4F46E5]/20 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  Reply as GigWay ✅
                </button>
                <button onClick={() => whatsapp(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs rounded-lg hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
                <button onClick={() => emailReply(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E2E] border border-[#334155] text-[#94A3B8] text-xs rounded-lg hover:text-white hover:border-[#475569] transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  Email Reply
                </button>
                {tab !== "urgent" && tab !== "closed" && (
                  <button
                    disabled={loading === t.id}
                    onClick={() => updateStatus(t.id, "in_progress", tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] text-xs rounded-lg hover:bg-[#FBBF24]/20 transition-colors disabled:opacity-50">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Mark Urgent
                  </button>
                )}
                {tab !== "closed" && (
                  <button
                    disabled={loading === t.id}
                    onClick={() => updateStatus(t.id, "resolved", tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] text-xs rounded-lg hover:bg-[#4ADE80]/20 transition-colors disabled:opacity-50">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Close
                  </button>
                )}
                {tab === "closed" && (
                  <button
                    disabled={loading === t.id}
                    onClick={() => updateStatus(t.id, "open", tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E2E] border border-[#334155] text-[#6B7280] text-xs rounded-lg hover:text-white transition-colors disabled:opacity-50">
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
