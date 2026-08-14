"use client"

import { useState } from "react"

export default function AIToolsPage() {
  const [projectDesc, setProjectDesc] = useState("")
  const [skills, setSkills] = useState("")
  const [coverResult, setCoverResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function generateCover() {
    if (!projectDesc.trim()) { setError("Please enter the project description"); return }
    setLoading(true); setError("")
    try { const res = await fetch("/api/ai/generate-cover-letter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectDescription: projectDesc, userSkills: skills.split(",").map(s => s.trim()).filter(Boolean) }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "AI service failed"); setCoverResult(data.cover_letter || "") } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong") } finally { setLoading(false) }
  }
  return <div className="min-h-screen bg-[#0F172A] px-4 py-10"><div className="mx-auto max-w-2xl"><h1 className="mb-2 text-3xl font-bold text-[#F8FAFC]">AI Career Tools</h1><p className="mb-8 text-[#94A3B8]">Tools to help you present your best work.</p><section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6"><span className="rounded-full bg-[#6366F1]/20 px-2.5 py-1 text-xs font-bold text-[#A5B4FC]">Coming soon</span><h2 className="mt-3 text-xl font-bold text-white">Resume Intelligence</h2><p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">Detailed resume feedback and professional insights are planned for a future GigWay Pro release.</p></section><section className="mt-6 rounded-xl border border-[#334155] bg-[#1E293B] p-6"><h2 className="text-xl font-bold text-white">Cover Letter</h2>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<label className="mt-4 block text-sm text-[#94A3B8]">Your Skills<input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, UI Design..." className="mt-1.5 w-full rounded-lg border border-[#334155] bg-[#0F172A] px-4 py-2.5 text-sm text-white" /></label><label className="mt-4 block text-sm text-[#94A3B8]">Project Description<textarea value={projectDesc} onChange={e => setProjectDesc(e.target.value)} rows={5} placeholder="Paste the project description or job posting here..." className="mt-1.5 w-full resize-none rounded-lg border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white" /></label><button onClick={generateCover} disabled={loading} className="mt-4 rounded-lg bg-[#8B5CF6] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Writing..." : "Generate Cover Letter"}</button>{coverResult && <div className="mt-5 rounded-lg border border-[#334155] bg-[#0F172A] p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-[#CBD5E1]">{coverResult}</p></div>}</section></div></div>
}
