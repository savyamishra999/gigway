"use client"

import { useState } from "react"
import { ExternalLink, FileText, Loader2, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

function fileNameFromUrl(url: string) {
  try {
    const { pathname } = new URL(url)
    return decodeURIComponent(pathname.split("/").pop() || "") || "Resume"
  } catch {
    return "Resume"
  }
}

// cv_url stays a plain text field in `profiles` — this just gives it a real upload
// path (reusing the "cvs" storage bucket OnboardingForm.tsx already uses) on top of
// the existing paste-a-link fallback, instead of showing the raw URL as text.
export default function ResumeCard({ url, onChange, userId }: { url: string; onChange: (url: string) => void; userId: string }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [pasting, setPasting] = useState(false)
  const [pasteValue, setPasteValue] = useState("")
  const supabase = createClient()

  const upload = async (file?: File) => {
    if (!file) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Please upload a PDF."); return }
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10MB."); return }
    setUploading(true); setError("")
    const path = `${userId}/${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage.from("cvs").upload(path, file, { upsert: true })
    if (uploadError) { setError("Upload failed. Please try again."); setUploading(false); return }
    const { data } = supabase.storage.from("cvs").getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  if (!url) {
    return (
      <div className="space-y-2">
        {!pasting ? (
          <>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#334155] hover:border-[#6366F1]/50 rounded-xl p-6 cursor-pointer transition-colors">
              <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={uploading} onChange={e => upload(e.target.files?.[0])} />
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-[#818CF8]" /> : <Upload className="h-6 w-6 text-[#6B7280]" />}
              <span className="text-sm text-[#94A3B8]">{uploading ? "Uploading…" : "Click to upload your resume (PDF)"}</span>
            </label>
            <button type="button" onClick={() => setPasting(true)} className="text-xs text-[#64748B] hover:text-white">
              Or paste a link instead
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <Input value={pasteValue} onChange={e => setPasteValue(e.target.value)}
              placeholder="https://drive.google.com/…"
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
            <button type="button" disabled={!pasteValue.trim()} onClick={() => onChange(pasteValue.trim())}
              className="px-4 rounded-lg bg-[#0F172A] hover:bg-[#334155] text-white border border-[#334155] disabled:opacity-40 text-sm">
              Save
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-xl p-3.5">
      <div className="w-9 h-9 rounded-lg bg-[#6366F1]/15 flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4 text-[#818CF8]" />
      </div>
      <p className="flex-1 min-w-0 text-sm font-medium text-[#F8FAFC] truncate">{fileNameFromUrl(url)}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#818CF8] hover:text-white flex items-center gap-1 flex-shrink-0">
        <ExternalLink className="h-3.5 w-3.5" /> View
      </a>
      <label className="text-xs font-semibold text-[#94A3B8] hover:text-white cursor-pointer flex-shrink-0">
        <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={uploading} onChange={e => upload(e.target.files?.[0])} />
        {uploading ? "Uploading…" : "Replace"}
      </label>
      <button type="button" onClick={() => onChange("")} className="text-[#64748B] hover:text-red-400 flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
