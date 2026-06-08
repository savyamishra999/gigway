"use client"

import { useState } from "react"
import { Send, Megaphone } from "lucide-react"

type Target = "all" | "freelancers" | "clients" | "boosted"

const TARGET_LABELS: Record<Target, string> = {
  all:         "All Users",
  freelancers: "Only Freelancers",
  clients:     "Only Clients",
  boosted:     "Only Boosted Users",
}

interface Props {
  counts: { all: number; boosted: number }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default function BroadcastClient({ counts }: Props) {
  const [title, setTitle]       = useState("")
  const [message, setMessage]   = useState("")
  const [target, setTarget]     = useState<Target>("all")
  const [sending, setSending]   = useState(false)
  const [toast, setToast]       = useState("")
  const [history, setHistory]   = useState<
    { id: string; title: string; target: string; sent_to: number; created_at: string }[]
  >([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000) }

  const targetCount = () => {
    if (target === "boosted") return counts.boosted
    return counts.all
  }

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      showToast("Title and message are required")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, target }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(`Sent to ${d.sentTo} users!`)
        setHistory(h => [{
          id: Date.now().toString(),
          title,
          target: TARGET_LABELS[target],
          sent_to: d.sentTo,
          created_at: new Date().toISOString(),
        }, ...h])
        setTitle("")
        setMessage("")
      } else {
        showToast(d.error || "Send failed")
      }
    } catch { showToast("Network error") }
    setSending(false)
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E1E2E] border border-[#334155] text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Compose */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. New feature launched!"
            maxLength={80}
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
        </div>

        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">
            Message <span className="text-[#475569] font-normal">({message.length}/500)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 500))}
            placeholder="Write your broadcast message..."
            rows={4}
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] resize-none"
          />
        </div>

        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">Target</label>
          <div className="grid grid-cols-2 gap-2">
            {(["all", "freelancers", "clients", "boosted"] as Target[]).map(t => (
              <button key={t} onClick={() => setTarget(t)}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors text-left ${
                  target === t
                    ? "bg-[#4F46E5] text-white"
                    : "bg-[#0F172A] border border-[#334155] text-[#6B7280] hover:text-white hover:border-[#475569]"
                }`}>
                {TARGET_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Preview count */}
        <div className="bg-[#F97316]/5 border border-[#F97316]/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#F97316] flex-shrink-0" />
          <p className="text-[#F97316] text-sm">
            This will send to <span className="font-black">{targetCount().toLocaleString()}</span> users
          </p>
        </div>

        <button
          onClick={send}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full py-3 bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white font-black text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : "Send Broadcast"}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-black">Sent This Session</h2>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Target</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide">Sent To</th>
                  <th className="text-left text-[#6B7280] font-semibold px-3 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-white text-xs font-medium truncate max-w-[160px]">{h.title}</td>
                    <td className="px-3 py-3 text-[#6B7280] text-xs hidden sm:table-cell">{h.target}</td>
                    <td className="px-3 py-3 text-[#4ADE80] text-xs font-semibold">{h.sent_to.toLocaleString()}</td>
                    <td className="px-3 py-3 text-[#475569] text-xs hidden md:table-cell">{fmt(h.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
