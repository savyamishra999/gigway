"use client"

import { useState } from "react"
import { X, Send, ChevronDown } from "lucide-react"

const SUBJECTS = [
  "General Query",
  "Payment Issue",
  "Report a User",
  "Feature Request",
  "Other",
]

interface Props {
  open: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
}

export default function SupportModal({ open, onClose, userName = "", userEmail = "" }: Props) {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSend = async () => {
    if (!message.trim()) { setError("Please write a message"); return }
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, name: userName, email: userEmail }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const d = await res.json()
        setError(d.error || "Failed to send")
      }
    } catch {
      setError("Network error — try again")
    }
    setSending(false)
  }

  const handleClose = () => {
    setSent(false)
    setMessage("")
    setSubject(SUBJECTS[0])
    setError("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div>
              <p className="text-white font-bold text-sm">
                GigWay <span className="text-blue-400">✅</span>
              </p>
              <p className="text-[#475569] text-xs">Support · We reply within 24h</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-[#475569] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-white font-bold text-lg mb-2">Message Received!</p>
            <p className="text-[#6B7280] text-sm mb-6">
              GigWay <span className="text-blue-400">✅</span> will reply within 24 hours.
              You&apos;ll get a notification when we respond.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-[#4F46E5] text-white text-sm font-bold rounded-xl hover:bg-[#4338CA] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Subject dropdown */}
            <div>
              <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-1.5">Subject</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full appearance-none bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] pr-9"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569] pointer-events-none" />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-1.5">
                Message <span className="text-[#334155] font-normal">({message.length}/500)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 500))}
                placeholder="Describe your issue or question..."
                rows={4}
                className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#334155] resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send to GigWay"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
