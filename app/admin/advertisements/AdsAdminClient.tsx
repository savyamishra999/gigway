"use client"

import { useState } from "react"
import { Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink, Mail } from "lucide-react"
import BannerAd from "@/components/ads/BannerAd"

interface Ad {
  id: string
  title: string
  subtitle?: string | null
  cta_text: string
  link_url: string
  image_url?: string | null
  accent_color: string
  target_roles: string[]
  position: string
  is_active: boolean
  priority: number
  created_at: string
  expires_at?: string | null
}

const ROLES = [
  { value: "freelancer",  label: "Freelancer" },
  { value: "job_seeker",  label: "Job Seeker" },
  { value: "individual",  label: "Individual (hire)" },
  { value: "company",     label: "Company" },
]

const POSITIONS = [
  { value: "all",         label: "All Pages" },
  { value: "dashboard",   label: "Dashboard" },
  { value: "jobs",        label: "Jobs Page" },
  { value: "gigs",        label: "Gigs Page" },
  { value: "freelancers", label: "Freelancers Page" },
]

const ACCENT_PRESETS = [
  "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#F97316", "#06B6D4",
]

const BLANK: Omit<Ad, "id" | "created_at" | "is_active"> = {
  title:        "",
  subtitle:     "",
  cta_text:     "Learn More",
  link_url:     "",
  image_url:    "",
  accent_color: "#4F46E5",
  target_roles: [],
  position:     "all",
  priority:     0,
  expires_at:   null,
}

export default function AdsAdminClient({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds]           = useState<Ad[]>(initialAds)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...BLANK })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")
  const [preview, setPreview]   = useState(false)

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter(r => r !== role)
        : [...f.target_roles, role],
    }))
  }

  const createAd = async () => {
    if (!form.title || !form.link_url) { setError("Title and Link URL are required"); return }
    setSaving(true); setError("")
    const res = await fetch("/api/admin/advertisements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Failed to create"); setSaving(false); return }
    setAds(prev => [data, ...prev])
    setForm({ ...BLANK })
    setShowForm(false)
    setSaving(false)
  }

  const toggleActive = async (ad: Ad) => {
    const res = await fetch("/api/admin/advertisements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, is_active: !ad.is_active }),
    })
    if (res.ok) {
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a))
    }
  }

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad?")) return
    await fetch("/api/admin/advertisements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setAds(prev => prev.filter(a => a.id !== id))
  }

  const previewAd = form.title && form.link_url
    ? { id: "preview", title: form.title, subtitle: form.subtitle, cta_text: form.cta_text || "Learn More", link_url: form.link_url, image_url: form.image_url, accent_color: form.accent_color }
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Banner Advertisements</h1>
          <p className="text-[#6B7280] text-sm mt-1">Manage sponsored banners shown to users based on their role</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError("") }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#4F46E5]/20"
        >
          <Plus className="h-4 w-4" />
          Add Banner Ad
        </button>
      </div>

      {/* Contact for advertisers */}
      <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#F97316]/10 border border-[#F59E0B]/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold">Advertising Enquiries</p>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Brands and course creators interested in advertising on GigWay — reach out:
          </p>
        </div>
        <a
          href="mailto:business@vjenix.com"
          className="flex items-center gap-2 bg-[#F59E0B] text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#D97706] transition-colors whitespace-nowrap"
        >
          <Mail className="h-4 w-4" />
          business@vjenix.com
        </a>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-6">Create New Banner Ad</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Title *</label>
              <input
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="e.g. Master React in 30 Days"
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">CTA Button Text</label>
              <input
                value={form.cta_text}
                onChange={e => set("cta_text", e.target.value)}
                placeholder="e.g. Enroll Now"
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Subtitle / Description</label>
            <input
              value={form.subtitle || ""}
              onChange={e => set("subtitle", e.target.value)}
              placeholder="e.g. India's #1 coding bootcamp for freelancers — get job-ready fast"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Link URL *</label>
              <input
                value={form.link_url}
                onChange={e => set("link_url", e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Logo / Image URL</label>
              <input
                value={form.image_url || ""}
                onChange={e => set("image_url", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Accent color */}
            <div>
              <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Accent Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {ACCENT_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => set("accent_color", c)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: form.accent_color === c ? "white" : "transparent",
                      transform: form.accent_color === c ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={e => set("accent_color", e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Show On Page</label>
              <select
                value={form.position}
                onChange={e => set("position", e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
              >
                {POSITIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Priority + Expiry */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={e => set("priority", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#6B7280] text-xs mb-1.5 font-medium">Expires</label>
                <input
                  type="date"
                  value={form.expires_at ? form.expires_at.split("T")[0] : ""}
                  onChange={e => set("expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white text-sm px-3 py-2.5 rounded-xl focus:border-[#4F46E5] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Target roles */}
          <div className="mb-6">
            <label className="block text-[#6B7280] text-xs mb-2 font-medium">
              Show to Roles <span className="text-[#475569] font-normal">(empty = all roles)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => toggleRole(r.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                    form.target_roles.includes(r.value)
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#4F46E5]/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {previewAd && (
            <div className="mb-6">
              <p className="text-[#6B7280] text-xs mb-2 font-medium">Preview</p>
              <BannerAd ad={previewAd} />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={createAd}
              disabled={saving}
              className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : "Create Banner Ad"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError("") }}
              className="bg-[#1E1E2E] text-[#6B7280] font-semibold px-6 py-2.5 rounded-xl text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ads list */}
      {ads.length === 0 ? (
        <div className="text-center py-20 bg-[#12121A] border border-[#1E1E2E] rounded-2xl">
          <p className="text-5xl mb-3">📢</p>
          <p className="text-white font-bold text-lg mb-1">No banner ads yet</p>
          <p className="text-[#6B7280] text-sm">Click "Add Banner Ad" to create your first sponsored banner.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map(ad => (
            <div key={ad.id} className={`bg-[#12121A] border rounded-2xl p-5 ${ad.is_active ? "border-[#1E1E2E]" : "border-[#1E1E2E] opacity-50"}`}>
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <BannerAd ad={ad} />
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569]">
                <span className="flex items-center gap-1">
                  Position: <span className="text-white font-medium capitalize">{ad.position}</span>
                </span>
                <span>·</span>
                <span>
                  Roles:{" "}
                  <span className="text-white font-medium">
                    {ad.target_roles.length === 0 ? "All" : ad.target_roles.join(", ")}
                  </span>
                </span>
                <span>·</span>
                <span>Priority: <span className="text-white font-medium">{ad.priority}</span></span>
                {ad.expires_at && (
                  <>
                    <span>·</span>
                    <span>
                      Expires:{" "}
                      <span className={`font-medium ${new Date(ad.expires_at) < new Date() ? "text-red-400" : "text-white"}`}>
                        {new Date(ad.expires_at).toLocaleDateString("en-IN")}
                      </span>
                    </span>
                  </>
                )}

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2">
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#475569] hover:text-white"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => toggleActive(ad)}
                    className={ad.is_active ? "text-[#4ADE80]" : "text-[#475569]"}
                    title={ad.is_active ? "Deactivate" : "Activate"}
                  >
                    {ad.is_active
                      ? <ToggleRight className="h-5 w-5" />
                      : <ToggleLeft className="h-5 w-5" />
                    }
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="text-[#475569] hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
