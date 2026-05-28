"use client"

import { useState } from "react"
import { Send, CheckCircle } from "lucide-react"

const SUBJECTS = [
  "General",
  "Payment Issue",
  "Report a User",
  "Feature Request",
]

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General", message: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const remaining = 500 - form.message.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong.")
      } else {
        setDone(true)
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-[#4ADE80]" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Message Sent!</h3>
        <p className="text-[#94A3B8] text-sm max-w-xs">
          We&apos;ve received your message and will reply within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold mb-1.5 uppercase tracking-wide">Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Rahul Sharma"
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
        </div>
        <div>
          <label className="block text-[#94A3B8] text-xs font-semibold mb-1.5 uppercase tracking-wide">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="rahul@example.com"
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[#94A3B8] text-xs font-semibold mb-1.5 uppercase tracking-wide">Subject *</label>
        <select
          value={form.subject}
          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
          className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5]"
        >
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">Message *</label>
          <span className={`text-xs ${remaining < 50 ? "text-red-400" : "text-[#475569]"}`}>
            {remaining} chars left
          </span>
        </div>
        <textarea
          required
          rows={5}
          maxLength={500}
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          placeholder="Describe your issue or question..."
          className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] resize-none"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
        {loading ? "Sending…" : "Send Message →"}
      </button>
    </form>
  )
}
