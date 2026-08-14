"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import GigImageUpload from "@/components/gigs/GigImageUpload"

const CATEGORIES = ["Design", "Development", "Writing", "Marketing", "Video", "Other"]

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-brand-midnight font-bold text-sm">{title}</h2>
        {sub && <p className="text-brand-slate text-xs mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function GigForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [deliveryDays, setDeliveryDays] = useState("3")
  const [imageUrl, setImageUrl] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const addTag = (t: string) => {
    const trimmed = t.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) setTags(prev => [...prev, trimmed])
    setTagInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError("Give your service a title"); return }
    if (!description.trim()) { setError("Add a description so clients know what to expect"); return }
    if (!category) { setError("Please select a category"); return }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setError("Enter a valid starting price"); return }
    setLoading(true); setError("")

    const response = await fetch("/api/gigs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, category, price, delivery_days: deliveryDays, tags, image_url: imageUrl || null }) })
    const data = await response.json().catch(() => ({})); setLoading(false)
    if (!response.ok) { setError(data.error === "upgrade_required" ? "Your free service slot is already active. Upgrade to Pro for up to 10 active services." : data.error || "Unable to publish service."); return }
    router.push(`/gigs/${data.gig_id}`)
  }

  return (
    <div className="bg-white border border-brand-borderLight rounded-card overflow-hidden shadow-soft">
      <div className="border-b border-brand-borderLight px-6 py-5">
        <h1 className="text-h2 font-extrabold text-brand-midnight">Create a Service</h1>
        <p className="text-brand-slate text-sm mt-1">Showcase what you do best and attract the right clients</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-7">
        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <Section title="Thumbnail" sub="A clear image helps your service stand out in search results.">
          <GigImageUpload value={imageUrl} onChange={setImageUrl} />
        </Section>

        <Section title="Service details">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-brand-midnight">Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="e.g. I will design a stunning logo for your brand"
                className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/60 focus:border-brand-indigo h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-midnight">Description *</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={5}
                placeholder="Describe what you offer, your process, and what clients will receive..."
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
                  {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => <SelectItem key={d} value={String(d)}>{d} day{d > 1 ? "s" : ""}</SelectItem>)}
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
                placeholder="499"
                className="bg-white border-brand-borderLight text-brand-midnight placeholder:text-brand-slate/60 focus:border-brand-indigo h-11 pl-7" />
            </div>
          </div>
        </Section>

        <Section title="Skills" sub="Up to 8 — helps clients find your service when searching.">
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

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}
            className="flex-1 sm:flex-initial bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold py-5 px-8 text-base shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]">
            {loading ? "Publishing..." : "Publish Service →"}
          </Button>
        </div>
      </form>
    </div>
  )
}
