"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Image as ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CATEGORIES = ["Design", "Development", "Writing", "Marketing", "Video", "Other"]

export default function GigForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [deliveryDays, setDeliveryDays] = useState("3")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const addTag = (t: string) => {
    const trimmed = t.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) setTags(prev => [...prev, trimmed])
    setTagInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) { setError("Please select a category"); return }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setError("Enter a valid price"); return }
    setLoading(true); setError("")

    const { data, error: insertError } = await supabase
      .from("gigs")
      .insert({
        owner_id: userId,
        title,
        description,
        category: category.toLowerCase(),
        price: parseFloat(price),
        delivery_days: parseInt(deliveryDays),
        tags,
        status: "active",
      })
      .select("id")
      .single()

    setLoading(false)
    if (insertError) { setError("Error creating gig: " + insertError.message); return }
    router.push(`/gigs/${data.id}`)
  }

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
      <div className="border-b border-[#1E1E2E] px-6 py-5">
        <h1 className="text-2xl font-black text-white">Create a Gig</h1>
        <p className="text-[#6B7280] text-sm mt-1">Showcase your services and attract clients</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {/* Image placeholder */}
        <div className="border-2 border-dashed border-[#1E1E2E] rounded-xl p-8 text-center">
          <ImageIcon className="h-8 w-8 text-[#4B5563] mx-auto mb-2" />
          <p className="text-[#6B7280] text-sm">Image upload coming soon</p>
          <p className="text-[#4B5563] text-xs mt-1">For now, your gig will show a category gradient thumbnail</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[#9CA3AF]">Gig Title *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="e.g. I will design a stunning logo for your brand"
            className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5] h-11" />
        </div>

        <div className="space-y-2">
          <Label className="text-[#9CA3AF]">Description *</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={5}
            placeholder="Describe what you offer, your process, and what clients will receive..."
            className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#9CA3AF]">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-[#0A0A0F] border-[#1E1E2E] text-white h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121A] border-[#1E1E2E] text-white">
                {CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#9CA3AF]">Delivery (days) *</Label>
            <Select value={deliveryDays} onValueChange={setDeliveryDays}>
              <SelectTrigger className="bg-[#0A0A0F] border-[#1E1E2E] text-white h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121A] border-[#1E1E2E] text-white">
                {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => <SelectItem key={d} value={String(d)}>{d} day{d > 1 ? "s" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#9CA3AF]">Starting Price (₹) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">₹</span>
            <Input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} required
              placeholder="499"
              className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5] h-11 pl-7" />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-[#9CA3AF]">Tags (up to 8)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <Badge key={tag} className="bg-[#4F46E5]/20 text-[#818CF8] border-[#4F46E5]/30 gap-1">
                {tag}
                <button type="button" onClick={() => setTags(p => p.filter(t => t !== tag))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput) }}}
              placeholder="Add tags (press Enter)"
              className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
            <Button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}
              className="bg-[#4F46E5]/20 text-[#818CF8] hover:bg-[#4F46E5]/30 border-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold py-5 text-base shadow-lg shadow-[#4F46E5]/20 hover:opacity-90">
          {loading ? "Creating Gig..." : "Publish Gig →"}
        </Button>
      </form>
    </div>
  )
}
