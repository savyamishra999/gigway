"use client"

import { useState } from "react"
import { CheckCircle, MessageCircle } from "lucide-react"

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919643693090"

export default function AffiliateJoinForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", platform_link: "", how_promote: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.how_promote.trim().length < 50) {
      setError("Please describe how you'll promote GigWay (min 50 characters).")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/affiliate/apply", {
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
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-[#4ADE80]" />
        </div>
        <div>
          <h3 className="text-white font-black text-xl mb-2">Application Submitted!</h3>
          <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
            We&apos;ll review and WhatsApp you within 24 hours.
          </p>
        </div>
        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi! I just applied for the GigWay affiliate program.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> Message us on WhatsApp
        </a>
      </div>
    )
  }

  const inputCls = "w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
  const labelCls = "block text-[#94A3B8] text-xs font-semibold mb-1.5 uppercase tracking-wide"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Full Name *</label>
        <input type="text" required value={form.name} onChange={set("name")}
          placeholder="Rahul Sharma" className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Email *</label>
          <input type="email" required value={form.email} onChange={set("email")}
            placeholder="rahul@gmail.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input type="tel" required value={form.phone} onChange={set("phone")}
            placeholder="9876543210" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Instagram / YouTube / Website *</label>
        <input type="url" required value={form.platform_link} onChange={set("platform_link")}
          placeholder="https://instagram.com/yourhandle" className={inputCls} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls.replace("mb-1.5", "")}>How will you promote GigWay? *</label>
          <span className={`text-xs ${form.how_promote.length < 50 ? "text-[#FBBF24]" : "text-[#4ADE80]"}`}>
            {form.how_promote.length}/50 min
          </span>
        </div>
        <textarea
          required
          rows={4}
          value={form.how_promote}
          onChange={set("how_promote")}
          placeholder="I'll post about GigWay on my Instagram with 10k followers, create YouTube videos about freelancing..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting…" : "Apply Now →"}
      </button>

      <p className="text-[#475569] text-xs text-center">
        We review all applications within 24 hours.
      </p>
    </form>
  )
}
