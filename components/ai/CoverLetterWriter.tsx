"use client"

import { useState } from "react"
import { FileText, Copy, Check, Sparkles } from "lucide-react"

const TONE_OPTIONS = ["professional", "friendly", "confident", "creative"]

export default function CoverLetterWriter() {
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [freelancerBio, setFreelancerBio] = useState("")
  const [tone, setTone] = useState("professional")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      setError("Project title and description are required")
      return
    }
    setLoading(true)
    setError("")
    setCoverLetter("")

    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTitle, projectDescription, freelancerBio, tone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to generate cover letter"); return }
      setCoverLetter(data.coverLetter)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
      <div className="border-b border-[#1E1E2E] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">AI Cover Letter Writer</h2>
            <p className="text-[#6B7280] text-sm">Generate winning proposals in seconds</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[#9CA3AF] text-sm font-medium block mb-2">Project Title *</label>
            <input
              type="text"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              placeholder="e.g. Build a React E-commerce Site"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#4B5563] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[#9CA3AF] text-sm font-medium block mb-2">Tone</label>
            <div className="flex gap-2 flex-wrap">
              {TONE_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                    tone === t
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#4F46E5]/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[#9CA3AF] text-sm font-medium block mb-2">Project Description *</label>
          <textarea
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            rows={4}
            placeholder="Paste the project description here..."
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#4B5563] focus:border-[#4F46E5] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-[#9CA3AF] text-sm font-medium block mb-2">Your Bio / Experience (optional)</label>
          <textarea
            value={freelancerBio}
            onChange={e => setFreelancerBio(e.target.value)}
            rows={3}
            placeholder="Brief description of your relevant experience..."
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#4B5563] focus:border-[#4F46E5] focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !projectTitle.trim() || !projectDescription.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white font-bold text-sm shadow-lg shadow-[#F97316]/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Writing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Cover Letter
            </>
          )}
        </button>

        {coverLetter && (
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Generated Cover Letter</p>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#818CF8] text-xs transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed whitespace-pre-wrap">{coverLetter}</p>
            <button
              onClick={handleGenerate}
              className="mt-4 text-[#4F46E5] hover:text-[#818CF8] text-xs font-medium transition-colors"
            >
              ↻ Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
