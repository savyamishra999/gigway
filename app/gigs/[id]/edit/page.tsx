"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import GigImageUpload from "@/components/gigs/GigImageUpload"

const CATEGORIES = ["Design", "Development", "Writing", "Marketing", "Video", "Other"]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-brand-midnight font-bold text-sm">{title}</h2>
      {children}
    </div>
  )
}

export default function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [deliveryDays, setDeliveryDays] = useState("3")
  const [imageUrl, setImageUrl] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { id: resolvedId } = await params
      setId(resolvedId)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: gig } = await supabase.from("gigs").select("*").eq("id", resolvedId).single()
      if (!gig || gig.freelancer_id !== user.id) { router.push(`/gigs/${resolvedId}`); return }

      setTitle(gig.title || "")
      setDescription(gig.description || "")
      setCategory(gig.category || "")
      setPrice(gig.price?.toString() || "")
      setDeliveryDays(gig.delivery_days?.toString() || "3")
      setImageUrl(gig.image_url || "")
      setTags(gig.tags || [])
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addTag = (t: string) => {
    const trimmed = t.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) setTags(prev => [...prev, trimmed])
    setTagInput("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!price || Number(price) <= 0) { setError("Enter a valid price"); return }
    setSaving(true)
    setError("")
    const { error: updateError } = await supabase.from("gigs").update({
      title,
      description,
      category: category.toLowerCase(),
      price: parseFloat(price),
      delivery_days: parseInt(deliveryDays),
      image_url: imageUrl || null,
      tags,
    }).eq("id", id)
    setSaving(false)
    if (updateError) { setError("Save failed: " + updateError.message); return }
    router.push(`/gigs/${id}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-ivory flex items-center justify-center">
      <p className="text-brand-slate">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-ivory py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white border border-brand-borderLight rounded-card overflow-hidden shadow-soft">
          <div className="border-b border-brand-borderLight px-6 py-5">
            <h1 className="text-h2 font-extrabold text-brand-midnight">Edit Service</h1>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-7">
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            <Section title="Thumbnail">
              <GigImageUpload value={imageUrl} onChange={setImageUrl} />
            </Section>

            <Section title="Service details">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-brand-midnight">Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required
                    className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/60 focus:border-brand-indigo h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-midnight">Description *</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} required
                    className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/60 focus:border-brand-indigo" />
                </div>
              </div>
            </Section>

            <Section title="Category & delivery">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-brand-midnight">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-white border-brand-borderLight text-brand-midnight h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-brand-borderLight text-brand-midnight">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-midnight">Delivery time *</Label>
                  <Select value={deliveryDays} onValueChange={setDeliveryDays}>
                    <SelectTrigger className="bg-white border-brand-borderLight text-brand-midnight h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-brand-borderLight text-brand-midnight">
                      {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => (
                        <SelectItem key={d} value={String(d)}>{d} day{d > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            <Section title="Pricing">
              <div className="space-y-2 max-w-xs">
                <Label className="text-brand-midnight">Starting price (₹) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate font-medium">₹</span>
                  <Input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} required
                    className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/60 focus:border-brand-indigo h-11 pl-7" />
                </div>
              </div>
            </Section>

            <Section title="Skills">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 text-sm">
                    {tag}
                    <button type="button" onClick={() => setTags(p => p.filter(t => t !== tag))} aria-label={`Remove ${tag}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput) }}}
                  placeholder="Add a skill (press Enter)"
                  disabled={tags.length >= 8}
                  className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/60 focus:border-brand-indigo" />
                <Button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput.trim() || tags.length >= 8}
                  className="bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo/15 border-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Section>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={saving}
                className="bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold px-8 shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}
                className="border-brand-borderLight text-brand-slate hover:bg-brand-ivory">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
