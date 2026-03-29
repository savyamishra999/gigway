"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, ExternalLink, Camera, Search } from "lucide-react"

interface Profile {
  id: string
  full_name: string | null
  job_function?: string | string[] | null
  bio: string | null
  skills: string[] | null
  hourly_rate: number | null
  avatar_url: string | null
  location?: string | null
  phone?: string | null
  portfolio_links?: string[] | null
  verification_status?: string | null
  is_verified?: boolean | null
}

const JOB_FUNCTIONS = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer",
  "UI/UX Designer", "Graphic Designer", "Brand Designer", "Motion Designer",
  "Content Writer", "Copywriter", "Technical Writer", "Social Media Manager",
  "Digital Marketer", "SEO Specialist", "Performance Marketer", "Email Marketer",
  "Data Analyst", "Data Scientist", "ML Engineer", "AI Engineer",
  "DevOps Engineer", "Cloud Architect", "QA Engineer", "Cybersecurity Analyst",
  "Product Manager", "Project Manager", "Business Analyst", "Scrum Master",
  "Video Editor", "Photographer", "3D Artist", "Animator",
  "Accountant", "Financial Analyst", "Legal Consultant", "HR Consultant",
  "Tutor", "Translator", "Voice Over Artist", "Musician",
]

const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  Development: [
    "React", "Next.js", "Vue.js", "Angular", "TypeScript", "JavaScript", "Node.js",
    "Python", "Django", "FastAPI", "Go", "Rust", "Java", "Spring Boot", "PHP",
    "Laravel", "Ruby on Rails", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "GraphQL", "REST API", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
  ],
  Design: [
    "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign",
    "After Effects", "Premiere Pro", "Blender", "Cinema 4D", "UI Design",
    "UX Research", "Wireframing", "Prototyping", "Brand Identity", "Logo Design",
  ],
  Marketing: [
    "SEO", "Google Ads", "Meta Ads", "Content Marketing", "Email Marketing",
    "Social Media Marketing", "Influencer Marketing", "Affiliate Marketing",
    "Analytics", "Conversion Optimization", "Growth Hacking", "Copywriting",
  ],
  Writing: [
    "Blog Writing", "Technical Writing", "Copywriting", "Content Strategy",
    "Ghostwriting", "Scriptwriting", "Proofreading", "Editing", "Translation",
    "Grant Writing", "Resume Writing", "Academic Writing",
  ],
  Video: [
    "Video Editing", "YouTube Content", "Reels / Shorts", "Motion Graphics",
    "Animation", "2D Animation", "3D Animation", "Color Grading",
    "Subtitling", "Video Production", "Podcast Editing",
  ],
  "AI Tools": [
    "ChatGPT", "Claude AI", "Midjourney", "DALL-E", "Stable Diffusion",
    "AI Copywriting", "AI Image Generation", "Prompt Engineering",
    "AI Automation", "LangChain", "RAG Systems",
  ],
  "Local Services": [
    "Plumbing", "Electrical Work", "Carpentry", "Painting", "Interior Design",
    "Home Cleaning", "Tutoring", "Cooking", "Event Photography",
    "Wedding Photography", "Catering", "Delivery",
  ],
}

const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).flat()

function normalizeJobFunction(value: string | string[] | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

export default function EditProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    job_function: normalizeJobFunction(profile?.job_function),
    bio: profile?.bio || "",
    location: profile?.location || "",
    phone: profile?.phone || "",
    hourly_rate: profile?.hourly_rate?.toString() || "",
    skills: profile?.skills || [] as string[],
    portfolio_links: profile?.portfolio_links || [] as string[],
    avatar_url: profile?.avatar_url || "",
  })
  const [jobFnSearch, setJobFnSearch] = useState("")
  const [skillsTab, setSkillsTab] = useState("Development")
  const [skillSearch, setSkillSearch] = useState("")
  const [customSkill, setCustomSkill] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState(profile?.verification_status || "unverified")
  const [requestingVerification, setRequestingVerification] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggleJobFunction = (fn: string) => {
    setFormData(prev => {
      const has = prev.job_function.includes(fn)
      if (has) return { ...prev, job_function: prev.job_function.filter(j => j !== fn) }
      if (prev.job_function.length >= 5) return prev
      return { ...prev, job_function: [...prev.job_function, fn] }
    })
  }

  const toggleSkill = (skill: string) => {
    setFormData(prev => {
      const has = prev.skills.includes(skill)
      if (has) return { ...prev, skills: prev.skills.filter(s => s !== skill) }
      if (prev.skills.length >= 20) return prev
      return { ...prev, skills: [...prev.skills, skill] }
    })
  }

  const addCustomSkill = () => {
    const trimmed = customSkill.trim()
    if (trimmed && !formData.skills.includes(trimmed) && formData.skills.length < 20) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setCustomSkill("")
  }

  const addLink = () => {
    const trimmed = linkInput.trim()
    if (trimmed && !formData.portfolio_links.includes(trimmed)) {
      setFormData(prev => ({ ...prev, portfolio_links: [...prev.portfolio_links, trimmed] }))
      setLinkInput("")
    }
  }

  const removeLink = (link: string) =>
    setFormData(prev => ({ ...prev, portfolio_links: prev.portfolio_links.filter(l => l !== link) }))

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    setError(null)
    const fileExt = file.name.split(".").pop()
    const filePath = `${userId}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))
    setUploading(false)
  }

  const requestVerification = async () => {
    setRequestingVerification(true)
    const { error: verError } = await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", userId)
    if (!verError) setVerificationStatus("pending")
    setRequestingVerification(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        job_function: formData.job_function.length > 0 ? formData.job_function : null,
        bio: formData.bio || null,
        location: formData.location || null,
        phone: formData.phone || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        skills: formData.skills,
        portfolio_links: formData.portfolio_links,
        avatar_url: formData.avatar_url || null,
      })
      .eq("id", userId)

    if (saveError) {
      setError(`Failed to save: ${saveError.message}`)
      setLoading(false)
      return
    }

    setSuccess("Profile saved successfully!")
    setLoading(false)
    router.refresh()
  }

  const filteredJobFunctions = jobFnSearch
    ? JOB_FUNCTIONS.filter(fn => fn.toLowerCase().includes(jobFnSearch.toLowerCase()))
    : JOB_FUNCTIONS

  const skillsToShow = skillSearch
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()))
    : (SKILLS_BY_CATEGORY[skillsTab] || [])

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-sm font-medium">{success}</div>
      )}

      {/* Avatar Upload */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#6366F1]/20 flex items-center justify-center">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-[#A5B4FC]">
                    {formData.full_name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center cursor-pointer hover:bg-[#4F46E5] transition-colors">
                <Camera className="h-3.5 w-3.5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </label>
            </div>
            <p className="text-[#94A3B8] text-sm">
              {uploading ? "Uploading..." : "Click the camera icon to change your photo"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader className="border-b border-[#334155] pb-3">
          <CardTitle className="text-[#F8FAFC] text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[#CBD5E1]">Full Name *</Label>
            <Input
              value={formData.full_name}
              onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your full name"
              required
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">Location</Label>
              <Input
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Mumbai, India"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">Phone</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 9876543210"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#CBD5E1]">Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              rows={4}
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#CBD5E1]">Hourly Rate (₹)</Label>
            <Input
              type="number"
              min="0"
              value={formData.hourly_rate}
              onChange={e => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
              placeholder="e.g. 500"
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] max-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Functions */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader className="border-b border-[#334155] pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#F8FAFC] text-lg">What do you do?</CardTitle>
            <span className="text-xs text-[#64748B]">{formData.job_function.length}/5 selected</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {formData.job_function.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.job_function.map(fn => (
                <span key={fn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 text-sm font-medium">
                  {fn}
                  <button type="button" onClick={() => toggleJobFunction(fn)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
            <input
              value={jobFnSearch}
              onChange={e => setJobFnSearch(e.target.value)}
              placeholder="Search job functions..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#6366F1]"
            />
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {filteredJobFunctions.map(fn => {
              const selected = formData.job_function.includes(fn)
              const disabled = !selected && formData.job_function.length >= 5
              return (
                <button
                  key={fn}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleJobFunction(fn)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? "bg-[#6366F1] text-white border-[#6366F1]"
                      : disabled
                      ? "bg-transparent text-[#334155] border-[#1E293B] cursor-not-allowed"
                      : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-[#A5B4FC]"
                  }`}
                >
                  {fn}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader className="border-b border-[#334155] pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#F8FAFC] text-lg">Skills</CardTitle>
            <span className="text-xs text-[#64748B]">{formData.skills.length}/20 selected</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 text-sm font-medium">
                  {skill}
                  <button type="button" onClick={() => toggleSkill(skill)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
            <input
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          {/* Category tabs (hidden when searching) */}
          {!skillSearch && (
            <div className="flex flex-wrap gap-1">
              {Object.keys(SKILLS_BY_CATEGORY).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSkillsTab(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    skillsTab === cat
                      ? "bg-[#6366F1] text-white"
                      : "bg-[#0F172A] text-[#64748B] hover:text-[#94A3B8] border border-[#334155]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Skills grid */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {skillsToShow.map(skill => {
              const selected = formData.skills.includes(skill)
              const disabled = !selected && formData.skills.length >= 20
              return (
                <button
                  key={skill}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? "bg-[#6366F1] text-white border-[#6366F1]"
                      : disabled
                      ? "bg-transparent text-[#334155] border-[#1E293B] cursor-not-allowed"
                      : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-[#A5B4FC]"
                  }`}
                >
                  {skill}
                </button>
              )
            })}
          </div>

          {/* Custom skill */}
          <div className="flex gap-2">
            <Input
              value={customSkill}
              onChange={e => setCustomSkill(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill() } }}
              placeholder="Add a custom skill..."
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]"
            />
            <Button type="button" onClick={addCustomSkill} disabled={!customSkill.trim() || formData.skills.length >= 20}
              className="bg-[#0F172A] hover:bg-[#334155] text-white border border-[#334155]">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Links */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader className="border-b border-[#334155] pb-3">
          <CardTitle className="text-[#F8FAFC] text-lg">Portfolio Links</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            {formData.portfolio_links.map(link => (
              <div key={link} className="flex items-center justify-between bg-[#0F172A] px-4 py-2 rounded-lg border border-[#334155]">
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="text-[#A5B4FC] text-sm truncate flex items-center gap-2 hover:underline">
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {link}
                </a>
                <button type="button" onClick={() => removeLink(link)} className="text-[#94A3B8] hover:text-red-400 ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink() } }}
              placeholder="https://yourportfolio.com"
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]"
            />
            <Button type="button" onClick={addLink} disabled={!linkInput.trim()}
              className="bg-[#0F172A] hover:bg-[#334155] text-white border border-[#334155]">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader className="border-b border-[#334155] pb-3">
          <CardTitle className="text-[#F8FAFC] text-lg">GigWay Verification</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {(profile?.is_verified || verificationStatus === "verified") ? (
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="font-semibold">GigWay Verified</p>
                <p className="text-[#94A3B8] text-sm">Your profile is verified</p>
              </div>
            </div>
          ) : verificationStatus === "pending" ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-lg">⏳</span>
              </div>
              <div>
                <p className="font-semibold text-[#F8FAFC]">Under Review</p>
                <p className="text-[#94A3B8] text-sm">Our team is reviewing your profile (24–48 hours)</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[#F8FAFC] font-semibold mb-1">Get GigWay Verified ✓</p>
              <p className="text-[#94A3B8] text-sm mb-4">Verified profiles get 3× more views and higher trust from clients.</p>
              <Button type="button" onClick={requestVerification} disabled={requestingVerification}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold">
                {requestingVerification ? "Submitting..." : "Apply for Verification"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}
          className="border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading || !formData.full_name}
          className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold px-8 hover:opacity-90">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
