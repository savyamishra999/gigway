"use client"
import { useId, useRef, useState } from "react"
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
const types = new Set(["image/jpeg", "image/png", "image/webp"])
const message = (error: { message?: string } | null, maxMb: number) => {
  const value = error?.message?.toLowerCase() || ""
  if (value.includes("bucket")) return "Image storage is temporarily unavailable. Please try again shortly."
  if (value.includes("permission") || value.includes("policy") || value.includes("row-level")) return "You do not have permission to upload this image. Please sign in again."
  if (value.includes("size") || value.includes("large")) return `Image storage rejected this file's size. Try a smaller image (under ${maxMb} MB).`
  return "Upload failed. Check your connection and try again."
}
export function ImageUploader({ value, onChange, kind = "avatar", label, maxMb = 5, guidance, workplacePreview = false, onBusyChange, disabled = false }: { value?: string; onChange: (url: string) => void; kind?: "avatar" | "cover" | "logo"; label: string; maxMb?: number; guidance?: string; workplacePreview?: boolean; onBusyChange?: (busy: boolean) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null), busy = useRef(false), id = useId()
  const [loading, setLoading] = useState(false), [error, setError] = useState("")
  const cover = kind === "cover", blocked = loading || disabled
  const upload = async (file?: File) => {
    if (!file || busy.current || disabled) return
    if (!types.has(file.type) || file.size > maxMb * 1024 * 1024) { setError(`Choose a JPG, PNG, or WebP no larger than ${maxMb} MB.`); return }
    busy.current = true; setLoading(true); onBusyChange?.(true); setError("")
    try {
      const db = createClient(), { data: { user } } = await db.auth.getUser()
      if (!user) { setError("Please sign in before uploading."); return }
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
      const path = `${user.id}/${kind}s/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await db.storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type })
      if (uploadError) setError(message(uploadError, maxMb))
      else onChange(db.storage.from("avatars").getPublicUrl(path).data.publicUrl)
    } catch { setError("Upload failed. Check your connection and try again.") }
    finally { busy.current = false; setLoading(false); onBusyChange?.(false) }
  }
  const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo disabled:opacity-50"
  return <div className="min-w-0 space-y-3" aria-busy={loading}>
    <input ref={ref} aria-label={label} aria-describedby={`${id}-guidance`} type="file" accept="image/jpeg,image/png,image/webp" disabled={blocked} className="hidden" onChange={e => { void upload(e.target.files?.[0]); e.currentTarget.value = "" }} />
    {cover ? <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-midnight to-brand-indigo ${workplacePreview ? "aspect-[2.5/1] sm:aspect-[6/1]" : "h-32"}`}>
      {value && <img src={value} alt="Cover preview" className="h-full w-full object-cover" />}
      {!workplacePreview && <button type="button" disabled={blocked} onClick={() => ref.current?.click()} className={`absolute inset-0 grid place-items-center bg-black/25 text-sm font-semibold text-white ${focus}`}><span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" />{loading ? "Uploading..." : value ? "Change cover" : label}</span></button>}
      {workplacePreview && <span aria-hidden="true" className="pointer-events-none absolute inset-x-[30%] inset-y-3 rounded border border-dashed border-white/70" />}
    </div> : <div className="flex min-w-0 flex-wrap items-center gap-4"><button type="button" aria-label={value ? `Change ${kind}` : label} disabled={blocked} onClick={() => ref.current?.click()} className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-indigo/10 text-brand-indigo ${workplacePreview ? "h-24 w-24" : "h-20 w-20"} ${focus}`}>
      {value ? <img src={value} alt={`${kind === "logo" ? "Workplace logo" : "Image"} preview`} className="h-full w-full object-cover" /> : <Camera className="h-6 w-6" />}
      {loading && <span className="absolute inset-0 grid place-items-center bg-black/50"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>}
    </button><button type="button" disabled={blocked} onClick={() => ref.current?.click()} className={`text-sm font-semibold text-brand-midnight ${focus}`}>{value ? `Change ${kind === "logo" ? "logo" : "image"}` : label}</button></div>}
    {cover && workplacePreview && <button type="button" disabled={blocked} onClick={() => ref.current?.click()} className={`rounded-lg border border-brand-borderLight px-3 py-2 text-sm font-semibold text-brand-indigo ${focus}`}>{value ? "Change cover" : label}</button>}
    <p id={`${id}-guidance`} className="text-xs leading-5 text-brand-slate">{guidance && <>{guidance}<br /></>}JPG, PNG or WebP · up to {maxMb} MB.</p>
    {value && (!cover || workplacePreview) && <button type="button" disabled={blocked} onClick={() => { onChange(""); setError("") }} className={`flex items-center gap-1 text-xs text-brand-coral ${focus}`}><Trash2 className="h-3 w-3" />Remove {kind === "cover" ? "cover" : kind === "logo" ? "logo" : "photo"}</button>}
    {loading && <p role="status" className="text-xs text-brand-slate">Uploading image...</p>}
    {error && <p role="alert" className="text-xs text-brand-coral">{error}</p>}
  </div>
}
