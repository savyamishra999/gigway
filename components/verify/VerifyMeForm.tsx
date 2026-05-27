"use client"

import { useState } from "react"
import { ShieldCheck, Linkedin, CreditCard, CheckCircle } from "lucide-react"

type DocType = "linkedin" | "aadhaar"

export default function VerifyMeForm() {
  const [docType, setDocType] = useState<DocType>("linkedin")
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate
    if (docType === "linkedin") {
      const trimmed = value.trim()
      if (!trimmed.includes("linkedin.com")) {
        setError("Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)")
        return
      }
    } else {
      const digits = value.trim()
      if (!/^\d{4}$/.test(digits)) {
        setError("Please enter exactly 4 digits (last 4 of your Aadhaar number)")
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/verify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: docType, doc_value: value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.")
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
      <div className="flex flex-col items-center text-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-[#4F46E5]/20 flex items-center justify-center mb-5">
          <CheckCircle className="h-10 w-10 text-[#818CF8]" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Submitted!</h2>
        <p className="text-[#94A3B8] mb-2 max-w-sm">
          Your verification is under review. We&apos;ll send a WhatsApp confirmation within 24 hours.
        </p>
        <p className="text-[#6B7280] text-sm mb-6">Your ✅ badge will appear once approved by our team.</p>
        <a
          href="/dashboard"
          className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Doc type selector */}
      <div>
        <p className="text-white font-semibold mb-3">Choose verification method:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setDocType("linkedin"); setValue("") }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              docType === "linkedin"
                ? "border-[#4F46E5] bg-[#4F46E5]/10"
                : "border-[#334155] bg-[#0F172A] hover:border-[#4F46E5]/40"
            }`}
          >
            <Linkedin className={`h-6 w-6 mb-2 ${docType === "linkedin" ? "text-[#818CF8]" : "text-[#6B7280]"}`} />
            <p className={`font-semibold text-sm ${docType === "linkedin" ? "text-white" : "text-[#6B7280]"}`}>LinkedIn URL</p>
            <p className="text-[#6B7280] text-xs mt-1">Share your public profile link</p>
          </button>

          <button
            type="button"
            onClick={() => { setDocType("aadhaar"); setValue("") }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              docType === "aadhaar"
                ? "border-[#4F46E5] bg-[#4F46E5]/10"
                : "border-[#334155] bg-[#0F172A] hover:border-[#4F46E5]/40"
            }`}
          >
            <CreditCard className={`h-6 w-6 mb-2 ${docType === "aadhaar" ? "text-[#818CF8]" : "text-[#6B7280]"}`} />
            <p className={`font-semibold text-sm ${docType === "aadhaar" ? "text-white" : "text-[#6B7280]"}`}>Aadhaar</p>
            <p className="text-[#6B7280] text-xs mt-1">Last 4 digits only — no full number</p>
          </button>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-[#94A3B8] text-sm font-medium mb-2">
          {docType === "linkedin" ? "Your LinkedIn profile URL" : "Last 4 digits of Aadhaar"}
        </label>
        {docType === "linkedin" ? (
          <input
            type="url"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            required
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569]"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            pattern="\d{4}"
            required
            className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-[#475569] tracking-widest text-center text-2xl font-mono"
          />
        )}
        {docType === "aadhaar" && (
          <p className="text-[#475569] text-xs mt-1.5">
            🔒 We only store the last 4 digits — your full Aadhaar is safe
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting…" : "Submit for Review →"}
      </button>

      <p className="text-center text-[#475569] text-xs">
        Your data is encrypted and only used for identity verification
      </p>
    </form>
  )
}
