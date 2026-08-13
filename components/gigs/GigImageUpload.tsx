"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Writes to the same "avatars" storage bucket already used for profile
// images (there's no dedicated gig-media bucket), under a distinct
// {userId}/gigs/ path — gigs.image_url already exists as a column, this
// just gives it a real upload path instead of the "coming soon" stub.
export default function GigImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const upload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP under 5MB.")
      return
    }
    setLoading(true)
    setError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Please sign in before uploading."); setLoading(false); return }
    const ext = file.name.split(".").pop() || "jpg"
    const path = `${user.id}/gigs/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: false })
    if (uploadError) { setError("We couldn't upload that image. Please try again."); setLoading(false); return }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path)
    onChange(data.publicUrl)
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => upload(e.target.files?.[0])} />
      <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-coral">
        {value && <img src={value} alt="Service thumbnail preview" className="h-full w-full object-cover" />}
        <button type="button" onClick={() => ref.current?.click()} disabled={loading}
          className={`absolute inset-0 grid place-items-center bg-black/30 text-sm font-semibold text-white transition-opacity disabled:opacity-100 ${
            value ? "opacity-0 hover:opacity-100 focus-visible:opacity-100" : "opacity-100"
          }`}>
          <span className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {loading ? "Uploading…" : value ? "Change thumbnail" : "Upload thumbnail"}
          </span>
        </button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-brand-slate text-xs">JPG, PNG or WebP · max 5MB. Optional — a category gradient is used if left blank.</p>
        {value && (
          <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-xs text-brand-coral flex-shrink-0">
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
