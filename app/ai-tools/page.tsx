"use client"

import { useState } from "react"

export default function AIToolsPage() {
  const [tab, setTab] = useState<"resume" | "cover">("resume")

  // Resume optimizer state
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState("")
  const [jobFunction, setJobFunction] = useState("")
  const [resumeResult, setResumeResult] = useState<{
    tagline?: string
    improved_bio?: string
    skill_suggestions?: string[]
    tips?: string[]
  } | null>(null)

  // Cover letter state
  const [projectDesc, setProjectDesc] = useState("")
  const [coverResult, setCoverResult] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optimizeResume = async () => {
    if (!bio.trim()) { setError("Please enter your bio"); return }
    setLoading(true)
    setError(null)
    setResumeResult(null)
    try {
      const res = await fetch("/api/ai/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          jobFunction,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "AI service failed")
      setResumeResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setLoading(false)
  }

  const generateCover = async () => {
    if (!projectDesc.trim()) { setError("Please enter the project description"); return }
    setLoading(true)
    setError(null)
    setCoverResult("")
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDescription: projectDesc,
          userSkills: skills.split(",").map(s => s.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "AI service failed")
      setCoverResult(data.cover_letter || "")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F172A] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[#F8FAFC] text-3xl font-bold mb-2">AI Career Tools</h1>
        <p className="text-[#94A3B8] mb-8">Powered by OpenAI — optimize your profile and write winning proposals</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["resume", "cover"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`px-5 py-2.5 rounded-lg border font-semibold text-sm transition-colors ${
                tab === t
                  ? "bg-[#6366F1] border-[#6366F1] text-white"
                  : "bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:border-[#6366F1]/40"
              }`}
            >
              {t === "resume" ? "✨ Resume Optimizer" : "📝 Cover Letter"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-500/40 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
            Error: {error}
          </div>
        )}

        {/* Shared skills field */}
        <div className="mb-4">
          <label className="text-[#94A3B8] text-sm block mb-1.5">Your Skills (comma separated)</label>
          <input
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="React, Node.js, UI Design, Python..."
            className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5 text-[#F8FAFC] text-sm outline-none focus:border-[#6366F1] placeholder:text-[#475569]"
          />
        </div>

        {/* Resume Optimizer Tab */}
        {tab === "resume" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[#94A3B8] text-sm block mb-1.5">Your current bio *</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={5}
                placeholder="Tell us about yourself, your experience, and what you do..."
                className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-3 text-[#F8FAFC] text-sm outline-none focus:border-[#6366F1] placeholder:text-[#475569] resize-none"
              />
            </div>
            <div>
              <label className="text-[#94A3B8] text-sm block mb-1.5">Job Function</label>
              <input
                value={jobFunction}
                onChange={e => setJobFunction(e.target.value)}
                placeholder="Full Stack Developer, UI Designer, Content Writer..."
                className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5 text-[#F8FAFC] text-sm outline-none focus:border-[#6366F1] placeholder:text-[#475569]"
              />
            </div>
            <button
              onClick={optimizeResume}
              disabled={loading}
              className="w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white font-bold py-3.5 rounded-lg text-base transition-colors"
            >
              {loading ? "Optimizing..." : "✨ Optimize My Profile"}
            </button>

            {resumeResult && (
              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 flex flex-col gap-4">
                {resumeResult.tagline && (
                  <div>
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1">Suggested Tagline</p>
                    <p className="text-[#06B6D4] font-semibold">&ldquo;{resumeResult.tagline}&rdquo;</p>
                  </div>
                )}
                {resumeResult.improved_bio && (
                  <div>
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1">Improved Bio</p>
                    <p className="text-[#CBD5E1] text-sm leading-relaxed">{resumeResult.improved_bio}</p>
                  </div>
                )}
                {resumeResult.skill_suggestions && resumeResult.skill_suggestions.length > 0 && (
                  <div>
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">Suggested Skills to Add</p>
                    <div className="flex flex-wrap gap-2">
                      {resumeResult.skill_suggestions.map((s, i) => (
                        <span key={i} className="bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30 px-3 py-1 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {resumeResult.tips && resumeResult.tips.length > 0 && (
                  <div>
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">Tips</p>
                    <ul className="flex flex-col gap-1.5">
                      {resumeResult.tips.map((tip, i) => (
                        <li key={i} className="text-[#CBD5E1] text-sm flex gap-2">
                          <span className="text-[#6366F1] font-bold">{i + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cover Letter Tab */}
        {tab === "cover" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[#94A3B8] text-sm block mb-1.5">Project Description *</label>
              <textarea
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
                rows={5}
                placeholder="Paste the project description or job posting here..."
                className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-3 text-[#F8FAFC] text-sm outline-none focus:border-[#6366F1] placeholder:text-[#475569] resize-none"
              />
            </div>
            <button
              onClick={generateCover}
              disabled={loading}
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-60 text-white font-bold py-3.5 rounded-lg text-base transition-colors"
            >
              {loading ? "Writing..." : "📝 Generate Cover Letter"}
            </button>

            {coverResult && (
              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">Generated Cover Letter</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(coverResult)}
                    className="text-[#6366F1] hover:text-[#A5B4FC] text-xs font-medium transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-wrap">{coverResult}</p>
                <button
                  onClick={generateCover}
                  className="mt-4 text-[#6366F1] hover:text-[#A5B4FC] text-xs font-medium transition-colors"
                >
                  ↻ Regenerate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
