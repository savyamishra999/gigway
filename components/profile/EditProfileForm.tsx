"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, ExternalLink, Camera, Search, Globe, Lock, CheckCircle2 } from "lucide-react"

interface Profile {
  id: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location?: string | null
  phone?: string | null
  phone_is_public?: boolean | null
  is_private?: boolean | null
  verification_status?: string | null
  is_verified?: boolean | null
  // role detection
  user_roles?: string[] | null
  find_work_type?: string | null
  hire_talent_type?: string | null
  // freelancer
  job_function?: string | string[] | null
  skills?: string[] | null
  portfolio_links?: string[] | null
  hourly_rate?: number | null
  // job seeker
  experience_years?: number | null
  experience_description?: string | null
  linkedin_url?: string | null
  cv_url?: string | null
  expected_salary?: string | null
  preferred_job_type?: string[] | null
  // hire talent
  company_name?: string | null
  company_size?: string | null
  company_website?: string | null
  industry?: string | null
  gst_number?: string | null
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
  "Other",
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

const JOB_TYPES = ["full_time", "part_time", "internship", "contract", "remote", "hybrid", "on_site"]
const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education", "E-commerce",
  "Manufacturing", "Real Estate", "Media & Entertainment", "Consulting",
  "Retail", "Logistics", "Agriculture", "Travel & Tourism", "Other",
]

function normalizeJobFunction(value: string | string[] | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

export default function EditProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const rawRoles    = (profile?.user_roles as string[] | null) ?? []
  const fwType      = profile?.find_work_type ?? null
  const htType      = profile?.hire_talent_type ?? null
  const showFreelancer = rawRoles.includes("find_work") && fwType !== "job_seeker"
  const showJobSeeker  = rawRoles.includes("find_work") && (fwType === "job_seeker" || fwType === "both")
  const showHireTalent = rawRoles.includes("hire_talent")

  const rawJobFns = normalizeJobFunction(profile?.job_function)
  const hasOther = rawJobFns.some(fn => !JOB_FUNCTIONS.slice(0, -1).includes(fn))
  const otherValue = hasOther ? rawJobFns.find(fn => !JOB_FUNCTIONS.slice(0, -1).includes(fn)) || "" : ""
  const normalizedJobFns = hasOther
    ? [...rawJobFns.filter(fn => JOB_FUNCTIONS.includes(fn) || fn === otherValue), "Other"]
    : rawJobFns

  const [formData, setFormData] = useState({
    full_name:         profile?.full_name || "",
    bio:               profile?.bio || "",
    location:          profile?.location || "",
    phone:             profile?.phone || "",
    phone_is_public:   profile?.phone_is_public !== false,
    is_private:        profile?.is_private === true,
    avatar_url:        profile?.avatar_url || "",
    // freelancer
    job_function:      normalizedJobFns,
    skills:            profile?.skills || [] as string[],
    portfolio_links:   profile?.portfolio_links || [] as string[],
    hourly_rate:       profile?.hourly_rate?.toString() || "",
    // job seeker
    experience_years:        profile?.experience_years?.toString() || "",
    experience_description:  profile?.experience_description || "",
    linkedin_url:            profile?.linkedin_url || "",
    cv_url:                  profile?.cv_url || "",
    expected_salary:         profile?.expected_salary || "",
    preferred_job_type:      profile?.preferred_job_type || [] as string[],
    // hire talent
    company_name:    profile?.company_name || "",
    company_size:    profile?.company_size || "",
    company_website: profile?.company_website || "",
    industry:        profile?.industry || "",
    gst_number:      profile?.gst_number || "",
  })
  const [otherJobFn, setOtherJobFn] = useState(otherValue)
  const [jobFnSearch, setJobFnSearch] = useState("")
  const [skillsTab, setSkillsTab] = useState("Development")
  const [skillSearch, setSkillSearch] = useState("")
  const [customSkill, setCustomSkill] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const verificationStatus = profile?.verification_status || "unverified"
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

  const toggleJobType = (t: string) => {
    setFormData(prev => {
      const has = prev.preferred_job_type.includes(t)
      return { ...prev, preferred_job_type: has ? prev.preferred_job_type.filter(x => x !== t) : [...prev.preferred_job_type, t] }
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
    if (uploadError) { setError(`Upload failed: ${uploadError.message}`); setUploading(false); return }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))
    setUploading(false)
  }

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    return digits.length === 10 || digits.length === 12
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!formData.phone.trim()) { setError("Phone number is required"); setLoading(false); return }
    if (!validatePhone(formData.phone)) { setError("Enter a valid 10-digit Indian phone number"); setLoading(false); return }

    const resolvedJobFns = formData.job_function
      .map(fn => fn === "Other" ? otherJobFn.trim() || "Other" : fn)
      .filter(Boolean)

    const updatePayload: Record<string, unknown> = {
      full_name:       formData.full_name,
      bio:             formData.bio || null,
      location:        formData.location || null,
      phone:           formData.phone || null,
      phone_is_public: formData.phone_is_public,
      is_private:      formData.is_private,
      avatar_url:      formData.avatar_url || null,
    }

    if (showFreelancer) {
      updatePayload.job_function    = resolvedJobFns.length > 0 ? resolvedJobFns : null
      updatePayload.skills          = formData.skills
      updatePayload.portfolio_links = formData.portfolio_links
      updatePayload.hourly_rate     = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
    }

    if (showJobSeeker) {
      updatePayload.experience_years       = formData.experience_years ? parseInt(formData.experience_years) : null
      updatePayload.experience_description = formData.experience_description || null
      updatePayload.linkedin_url           = formData.linkedin_url || null
      updatePayload.cv_url                 = formData.cv_url || null
      updatePayload.expected_salary        = formData.expected_salary || null
      updatePayload.preferred_job_type     = formData.preferred_job_type.length > 0 ? formData.preferred_job_type : null
    }

    if (showHireTalent) {
      updatePayload.company_name    = formData.company_name || null
      updatePayload.company_size    = formData.company_size || null
      updatePayload.company_website = formData.company_website || null
      updatePayload.industry        = formData.industry || null
      updatePayload.gst_number      = formData.gst_number || null
    }

    const { error: saveError } = await supabase.from("profiles").update(updatePayload).eq("id", userId)

    if (saveError) { setError(`Failed to save: ${saveError.message}`); setLoading(false); return }

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

  const isVerified = profile?.is_verified || verificationStatus === "verified"

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-sm font-medium">{success}</div>
      )}

      {/* Profile Visibility Toggle */}
      <div className="flex items-center justify-between bg-[#1E293B] border border-[#334155] rounded-xl px-5 py-3">
        <div>
          <p className="text-[#F8FAFC] font-semibold text-sm">Profile Visibility</p>
          <p className="text-[#64748B] text-xs mt-0.5">
            {formData.is_private ? "Only companies and admin can view your profile" : "Your profile is visible to everyone"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, is_private: !prev.is_private }))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            formData.is_private
              ? "bg-[#334155] border-[#475569] text-[#94A3B8]"
              : "bg-[#6366F1]/15 border-[#6366F1]/40 text-[#A5B4FC]"
          }`}
        >
          {formData.is_private
            ? <><Lock className="h-3.5 w-3.5" /> Private</>
            : <><Globe className="h-3.5 w-3.5" /> Public</>
          }
        </button>
      </div>

      {/* Avatar */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#6366F1]/20 flex items-center justify-center">
                {formData.avatar_url
                  ? <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-[#A5B4FC]">{formData.full_name?.[0]?.toUpperCase() || "?"}</span>
                }
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center cursor-pointer hover:bg-[#4F46E5] transition-colors">
                <Camera className="h-3.5 w-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </label>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#3B82F6] fill-[#3B82F6] stroke-white" />
                </div>
              )}
            </div>
            <p className="text-[#94A3B8] text-sm">{uploading ? "Uploading..." : "Click the camera icon to change your photo"}</p>
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
            <Input value={formData.full_name}
              onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your full name"
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#CBD5E1]">Location</Label>
            <Input value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Mumbai, India"
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#CBD5E1]">Phone Number <span className="text-red-400">*</span></Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm select-none">+91</span>
                <Input value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/[^\d+\s-]/g, "") }))}
                  placeholder="9876543210" maxLength={14}
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] pl-11" />
              </div>
              <button type="button"
                onClick={() => setFormData(prev => ({ ...prev, phone_is_public: !prev.phone_is_public }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${
                  formData.phone_is_public
                    ? "bg-[#6366F1]/15 border-[#6366F1]/40 text-[#A5B4FC]"
                    : "bg-[#334155] border-[#475569] text-[#94A3B8]"
                }`}>
                {formData.phone_is_public ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
              </button>
            </div>
            <p className="text-[#475569] text-xs">{formData.phone_is_public ? "Visible to everyone" : "Only visible to admin"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-[#CBD5E1]">Bio</Label>
            <Textarea value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..." rows={4}
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
          </div>
        </CardContent>
      </Card>

      {/* ── FREELANCER SECTION ── */}
      {showFreelancer && (
        <>
          {/* Job Functions */}
          <Card className="bg-[#1E293B] border-[#334155]">
            <CardHeader className="border-b border-[#334155] pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#F8FAFC] text-lg">What do you do?</CardTitle>
                <span className="text-xs text-[#64748B]">{formData.job_function.length}/5</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {formData.job_function.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.job_function.map(fn => (
                    <span key={fn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 text-sm font-medium">
                      {fn === "Other" && otherJobFn ? otherJobFn : fn}
                      <button type="button" onClick={() => toggleJobFunction(fn)} className="hover:text-white"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              {formData.job_function.includes("Other") && (
                <Input value={otherJobFn} onChange={e => setOtherJobFn(e.target.value)}
                  placeholder="Describe what you do..."
                  className="bg-[#0F172A] border-[#6366F1]/50 text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
                <input value={jobFnSearch} onChange={e => setJobFnSearch(e.target.value)}
                  placeholder="Search job functions..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#6366F1]" />
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {filteredJobFunctions.map(fn => {
                  const selected = formData.job_function.includes(fn)
                  const disabled = !selected && formData.job_function.length >= 5
                  return (
                    <button key={fn} type="button" disabled={disabled} onClick={() => toggleJobFunction(fn)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${fn === "Other" ? "border-dashed" : ""} ${
                        selected ? "bg-[#6366F1] text-white border-[#6366F1]"
                        : disabled ? "bg-transparent text-[#334155] border-[#1E293B] cursor-not-allowed"
                        : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-[#A5B4FC]"
                      }`}>
                      {fn}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Rate */}
          <Card className="bg-[#1E293B] border-[#334155]">
            <CardHeader className="border-b border-[#334155] pb-3">
              <CardTitle className="text-[#F8FAFC] text-lg">Hourly Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <Input type="number" value={formData.hourly_rate}
                  onChange={e => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="e.g. 1500"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] pl-7" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">/hr</span>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-[#1E293B] border-[#334155]">
            <CardHeader className="border-b border-[#334155] pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#F8FAFC] text-lg">Skills</CardTitle>
                <span className="text-xs text-[#64748B]">{formData.skills.length}/20</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 text-sm font-medium">
                      {skill}
                      <button type="button" onClick={() => toggleSkill(skill)} className="hover:text-white"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
                <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#6366F1]" />
              </div>
              {!skillSearch && (
                <div className="flex flex-wrap gap-1">
                  {Object.keys(SKILLS_BY_CATEGORY).map(cat => (
                    <button key={cat} type="button" onClick={() => setSkillsTab(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        skillsTab === cat ? "bg-[#6366F1] text-white" : "bg-[#0F172A] text-[#64748B] hover:text-[#94A3B8] border border-[#334155]"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {skillsToShow.map(skill => {
                  const selected = formData.skills.includes(skill)
                  const disabled = !selected && formData.skills.length >= 20
                  return (
                    <button key={skill} type="button" disabled={disabled} onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selected ? "bg-[#6366F1] text-white border-[#6366F1]"
                        : disabled ? "bg-transparent text-[#334155] border-[#1E293B] cursor-not-allowed"
                        : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-[#A5B4FC]"
                      }`}>
                      {skill}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Input value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill() } }}
                  placeholder="Add a custom skill..."
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
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
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />{link}
                    </a>
                    <button type="button" onClick={() => removeLink(link)} className="text-[#94A3B8] hover:text-red-400 ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink() } }}
                  placeholder="https://yourportfolio.com"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                <Button type="button" onClick={addLink} disabled={!linkInput.trim()}
                  className="bg-[#0F172A] hover:bg-[#334155] text-white border border-[#334155]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── JOB SEEKER SECTION ── */}
      {showJobSeeker && (
        <Card className="bg-[#1E293B] border-[#334155]">
          <CardHeader className="border-b border-[#334155] pb-3">
            <CardTitle className="text-[#F8FAFC] text-lg">Job Seeker Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Years of Experience</Label>
                <Input type="number" min="0" max="50" value={formData.experience_years}
                  onChange={e => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                  placeholder="e.g. 3"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Expected Salary (₹/month)</Label>
                <Input value={formData.expected_salary}
                  onChange={e => setFormData(prev => ({ ...prev, expected_salary: e.target.value }))}
                  placeholder="e.g. 50000"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">Preferred Job Type</Label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleJobType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                      formData.preferred_job_type.includes(t)
                        ? "bg-[#378ADD] text-white border-[#378ADD]"
                        : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#378ADD]/50"
                    }`}>
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">Experience Summary</Label>
              <Textarea value={formData.experience_description}
                onChange={e => setFormData(prev => ({ ...prev, experience_description: e.target.value }))}
                placeholder="Briefly describe your work experience..." rows={3}
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">LinkedIn URL</Label>
              <Input value={formData.linkedin_url}
                onChange={e => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/yourname"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">CV / Resume URL</Label>
              <Input value={formData.cv_url}
                onChange={e => setFormData(prev => ({ ...prev, cv_url: e.target.value }))}
                placeholder="https://drive.google.com/... or any public link"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              <p className="text-[#475569] text-xs">Paste a Google Drive, Dropbox, or any public link to your CV</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── HIRE TALENT SECTION ── */}
      {showHireTalent && (
        <Card className="bg-[#1E293B] border-[#334155]">
          <CardHeader className="border-b border-[#334155] pb-3">
            <CardTitle className="text-[#F8FAFC] text-lg">
              {htType === "company" ? "Company Details" : "Hiring Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">{htType === "company" ? "Company Name" : "Organisation / Name"}</Label>
                <Input value={formData.company_name}
                  onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="e.g. Acme Pvt Ltd"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Industry</Label>
                <select value={formData.industry}
                  onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Company Size</Label>
                <select value={formData.company_size}
                  onChange={e => setFormData(prev => ({ ...prev, company_size: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]">
                  <option value="">Select size</option>
                  {["1-10", "11-50", "51-200", "201-500", "500+"].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Website</Label>
                <Input value={formData.company_website}
                  onChange={e => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                  placeholder="https://yourcompany.com"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">GST Number <span className="text-[#475569] text-xs">(optional)</span></Label>
              <Input value={formData.gst_number}
                onChange={e => setFormData(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                placeholder="22AAAAA0000A1Z5" maxLength={15}
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] font-mono" />
            </div>
          </CardContent>
        </Card>
      )}

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
