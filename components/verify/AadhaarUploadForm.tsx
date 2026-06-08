"use client"

import { useState, useRef } from "react"
import { Upload, CheckCircle, Loader2, X, FileImage } from "lucide-react"

type FileState = { file: File | null; preview: string | null }

export default function AadhaarUploadForm() {
  const [front, setFront] = useState<FileState>({ file: null, preview: null })
  const [back, setBack]   = useState<FileState>({ file: null, preview: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef  = useRef<HTMLInputElement>(null)

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileState>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      setError("Only JPG, PNG, WebP or PDF allowed")
      return
    }
    setError("")
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    setter({ file, preview })
  }

  const clearFile = (setter: React.Dispatch<React.SetStateAction<FileState>>) => {
    setter({ file: null, preview: null })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!front.file || !back.file) {
      setError("Please upload both front and back of your Aadhaar.")
      return
    }
    setError("")
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append("front", front.file)
      fd.append("back", back.file)

      const res = await fetch("/api/verify-me/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.")
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
          <h3 className="text-white font-black text-xl mb-2">Documents Submitted!</h3>
          <p className="text-[#94A3B8] text-sm max-w-xs">
            We&apos;ll review your Aadhaar within 24 hours and notify you when verified.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Front */}
      <FileUploadZone
        label="Aadhaar Front Side"
        hint="Front with your name and photo"
        state={front}
        inputRef={frontRef}
        onChange={e => handleFile(e, setFront)}
        onClear={() => clearFile(setFront)}
      />

      {/* Back */}
      <FileUploadZone
        label="Aadhaar Back Side"
        hint="Back with address and barcode"
        state={back}
        inputRef={backRef}
        onChange={e => handleFile(e, setBack)}
        onClear={() => clearFile(setBack)}
      />

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !front.file || !back.file}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="h-4 w-4" /> Submit Documents</>
        )}
      </button>
    </form>
  )
}

function FileUploadZone({
  label, hint, state, inputRef, onChange, onClear,
}: {
  label: string
  hint: string
  state: FileState
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}) {
  return (
    <div>
      <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">
        {label} *
      </label>
      {state.file ? (
        <div className="relative bg-[#0F172A] border border-[#334155] rounded-xl p-3 flex items-center gap-3">
          {state.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.preview} alt={label} className="h-16 w-24 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="h-16 w-24 bg-[#1E293B] rounded-lg flex items-center justify-center flex-shrink-0">
              <FileImage className="h-6 w-6 text-[#475569]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{state.file.name}</p>
            <p className="text-[#475569] text-xs">{(state.file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#6B7280] hover:text-white transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#334155] hover:border-[#4F46E5]/50 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors group"
        >
          <Upload className="h-6 w-6 text-[#475569] group-hover:text-[#818CF8] transition-colors" />
          <span className="text-[#6B7280] text-sm group-hover:text-white transition-colors">
            Click to upload
          </span>
          <span className="text-[#475569] text-xs">{hint}</span>
          <span className="text-[#334155] text-xs">JPG, PNG, PDF — max 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}
