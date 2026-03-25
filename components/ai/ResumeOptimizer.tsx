"use client"

import { useState } from "react"
import { Sparkles, Copy, Check } from "lucide-react"

export default function ResumeOptimizer() {
  const [resumeText, setResumeText] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{
    summary?: string
    improvements?: string[]
    keywords?: string[]
    tagline?: string
    raw?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleOptimize = async () => {
    if (!resumeText.trim()) { setError("Please paste your resume or bio text"); return }
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/ai/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to optimize resume"); return }
      setResult(data.result)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
      <div className="border-b border-[#1E1E2E] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#818CF8] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">AI Resume Optimizer</h2>
            <p className="text-[#6B7280] text-sm">Get AI-powered suggestions to improve your profile</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <div>
          <label className="text-[#9CA3AF] text-sm font-medium block mb-2">Target Role / Niche (optional)</label>
          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. React Developer, Logo Designer, Content Writer"
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#4B5563] focus:border-[#4F46E5] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[#9CA3AF] text-sm font-medium block mb-2">Your Resume / Bio *</label>
          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={6}
            placeholder="Paste your current bio, resume summary, or work experience here..."
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#4B5563] focus:border-[#4F46E5] focus:outline-none resize-none"
          />
          <p className="text-[#4B5563] text-xs mt-1">{resumeText.length} characters</p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading || !resumeText.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Optimize My Profile
            </>
          )}
        </button>

        {result && (
          <div className="space-y-4 mt-2">
            {result.tagline && (
              <div className="bg-[#4F46E5]/10 border border-[#4F46E5]/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#818CF8] text-xs font-semibold uppercase tracking-wide">Suggested Tagline</p>
                  <button onClick={() => copyText(result.tagline!)} className="text-[#6B7280] hover:text-[#818CF8]">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-white font-medium">"{result.tagline}"</p>
              </div>
            )}

            {result.summary && (
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Optimized Summary</p>
                  <button onClick={() => copyText(result.summary!)} className="text-[#6B7280] hover:text-[#818CF8]">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{result.summary}</p>
              </div>
            )}

            {result.improvements && result.improvements.length > 0 && (
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
                <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-3">Key Improvements</p>
                <ul className="space-y-2">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                      <span className="text-[#4F46E5] font-bold mt-0.5">{i + 1}.</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.keywords && result.keywords.length > 0 && (
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
                <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-3">Power Keywords to Add</p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 rounded-full text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.raw && !result.summary && (
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
                <p className="text-[#9CA3AF] text-sm leading-relaxed whitespace-pre-wrap">{result.raw}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
