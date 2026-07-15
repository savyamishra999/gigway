"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Search, Camera, CheckCircle, Briefcase, BookOpen, Building2, ChevronRight } from "lucide-react"

// ── constants ────────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: "freelancer",
    label: "Freelancer",
    desc: "Offer your skills as services and earn money from clients worldwide",
    icon: Briefcase,
    color: "#1D9E75",
    bg: "from-[#1D9E75]/20 to-[#1D9E75]/5",
    border: "border-[#1D9E75]",
    check: "bg-[#1D9E75]",
  },
  {
    id: "job_seeker",
    label: "Job Seeker",
    desc: "Find your next full-time or part-time job opportunity",
    icon: BookOpen,
    color: "#378ADD",
    bg: "from-[#378ADD]/20 to-[#378ADD]/5",
    border: "border-[#378ADD]",
    check: "bg-[#378ADD]",
  },
  {
    id: "employer",
    label: "Employer",
    desc: "Post jobs and hire top talent for your company",
    icon: Building2,
    color: "#F59E0B",
    bg: "from-[#F59E0B]/20 to-[#F59E0B]/5",
    border: "border-[#F59E0B]",
    check: "bg-[#F59E0B]",
  },
]

const JOB_FUNCTIONS = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "Mobile Developer", "UI/UX Designer", "Graphic Designer",
  "Content Writer", "Copywriter", "SEO Specialist",
  "Digital Marketer", "Social Media Manager", "Video Editor",
  "Motion Graphics", "Photographer", "Data Analyst",
  "Data Scientist", "AI/ML Engineer", "DevOps Engineer",
  "Cybersecurity", "Project Manager", "Business Analyst",
  "Sales Professional", "HR Professional", "Accountant",
  "Legal Consultant", "Translator", "Voice Over Artist",
  "Music Producer", "3D Artist", "Architect",
  "Interior Designer", "Event Planner", "Caterer",
  "Carpenter", "Electrician", "Plumber", "Mechanic",
  "Tutor/Teacher", "Fitness Trainer", "Chef", "Other",
]

const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Development": ["JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular", "Node.js", "Python", "Django", "FastAPI", "PHP", "Laravel", "Java", "Spring Boot", "Go", "Rust", "Ruby on Rails", "GraphQL", "REST API", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Flutter", "React Native", "Swift", "Kotlin", "Android", "iOS"],
  "Design": ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign", "After Effects", "Premiere Pro", "UI Design", "UX Design", "Logo Design", "Brand Identity", "Motion Graphics", "3D Modeling", "Blender", "Cinema 4D", "Canva", "Web Design", "Mobile Design"],
  "Marketing": ["SEO", "Google Ads", "Facebook Ads", "Instagram Marketing", "LinkedIn Marketing", "Email Marketing", "Content Marketing", "Affiliate Marketing", "Growth Hacking", "Analytics", "Copywriting", "Brand Strategy"],
  "Writing": ["Content Writing", "Blog Writing", "Technical Writing", "Creative Writing", "Ghostwriting", "Proofreading", "Editing", "Academic Writing", "Script Writing", "Translation"],
  "Video": ["Video Editing", "YouTube", "Short Form Video", "Reels/TikTok", "Animation", "Explainer Videos", "Subtitling", "Color Grading", "Thumbnail Design"],
  "AI Tools": ["ChatGPT", "Midjourney", "Stable Diffusion", "AI Content", "Prompt Engineering", "AI Automation", "n8n", "Make.com", "Zapier"],
  "Local Services": ["Event Planning", "Catering", "Photography", "Videography", "Carpentry", "Electrical Work", "Plumbing", "Interior Design", "Tutoring", "Fitness Training", "Chef/Cooking", "Car Repair", "Cleaning Services"],
}
const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).flat()

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education", "E-commerce",
  "Marketing & Advertising", "Media & Entertainment", "Manufacturing", "Real Estate",
  "Consulting", "Legal", "Hospitality", "Logistics", "Agriculture", "NGO / Non-profit",
  "Government", "Retail", "Automotive", "Telecom", "Other",
]

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"]

// ── types ─────────────────────────────────────────────────────────────────────

type RoleId = "freelancer" | "job_seeker" | "employer"

interface FormData {
  // common
  full_name: string
  phone: string
  avatar_url: string
  bio: string
  location: string
  // freelancer
  job_function: string[]
  skills: string[]
  portfolio_links: string[]
  // job seeker
  experience_years: string
  experience_description: string
  linkedin_url: string
  // employer
  company_name: string
  company_size: string
  company_website: string
  industry: string
}

// ── component ─────────────────────────────────────────────────────────────────

export default function OnboardingForm({ userId }: { userId: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skillSearch, setSkillSearch] = useState("")
  const [skillCategory, setSkillCategory] = useState("Development")
  const [linkInput, setLinkInput] = useState("")
  const [jfSearch, setJfSearch] = useState("")
  const [formData, setFormData] = useState<FormData>({
    full_name: "", phone: "", avatar_url: "", bio: "", location: "",
    job_function: [], skills: [], portfolio_links: [],
    experience_years: "", experience_description: "", linkedin_url: "",
    company_name: "", company_size: "", company_website: "", industry: "",
  })

  const router = useRouter()
  const supabase = createClient()

  const isFreelancer = selectedRoles.includes("freelancer")
  const isJobSeeker = selectedRoles.includes("job_seeker")
  const isEmployer = selectedRoles.includes("employer")

  // ── role toggle ────────────────────────────────────────────────────────────

  const toggleRole = (id: RoleId) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  // ── avatar upload ──────────────────────────────────────────────────────────

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))
    }
    setUploading(false)
  }

  // ── freelancer helpers ─────────────────────────────────────────────────────

  const toggleJobFunction = (fn: string) => {
    setFormData(prev => {
      if (prev.job_function.includes(fn)) return { ...prev, job_function: prev.job_function.filter(j => j !== fn) }
      if (prev.job_function.length >= 5) return prev
      return { ...prev, job_function: [...prev.job_function, fn] }
    })
  }

  const toggleSkill = (skill: string) => {
    setFormData(prev => {
      if (prev.skills.includes(skill)) return { ...prev, skills: prev.skills.filter(s => s !== skill) }
      if (prev.skills.length >= 20) return prev
      return { ...prev, skills: [...prev.skills, skill] }
    })
  }

  const addCustomSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !formData.skills.includes(trimmed) && formData.skills.length < 20) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setSkillInput("")
  }

  const addLink = () => {
    const trimmed = linkInput.trim()
    if (trimmed && !formData.portfolio_links.includes(trimmed)) {
      setFormData(prev => ({ ...prev, portfolio_links: [...prev.portfolio_links, trimmed] }))
      setLinkInput("")
    }
  }

  const filteredJF = jfSearch
    ? JOB_FUNCTIONS.filter(fn => fn.toLowerCase().includes(jfSearch.toLowerCase()))
    : JOB_FUNCTIONS

  const filteredSkills = skillSearch
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !formData.skills.includes(s))
    : (SKILLS_BY_CATEGORY[skillCategory] || []).filter(s => !formData.skills.includes(s))

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.full_name.trim()) { setError("Full name is required"); return }
    if (!formData.phone.trim()) { setError("Phone number is required"); return }
    const digits = formData.phone.replace(/\D/g, "")
    if (digits.length !== 10 && digits.length !== 12) { setError("Enter a valid 10-digit phone number"); return }
    if (isFreelancer && formData.skills.length === 0) { setError("Select at least 1 skill for your freelancer profile"); return }
    if (isEmployer && !formData.company_name.trim()) { setError("Company name is required for employers"); return }

    setLoading(true)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        user_roles: selectedRoles,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        avatar_url: formData.avatar_url || null,
        bio: formData.bio || null,
        location: formData.location || null,
        // freelancer
        job_function: isFreelancer && formData.job_function.length > 0 ? formData.job_function : null,
        skills: isFreelancer ? formData.skills : [],
        portfolio_links: isFreelancer ? formData.portfolio_links : [],
        // job seeker
        experience_years: isJobSeeker && formData.experience_years ? parseInt(formData.experience_years) : null,
        experience_description: isJobSeeker ? (formData.experience_description || null) : null,
        linkedin_url: isJobSeeker ? (formData.linkedin_url || null) : null,
        // employer
        company_name: isEmployer ? (formData.company_name.trim() || null) : null,
        company_size: isEmployer ? (formData.company_size || null) : null,
        company_website: isEmployer ? (formData.company_website || null) : null,
        industry: isEmployer ? (formData.industry || null) : null,
        profile_completed: true,
      })
      .eq("id", userId)

    setLoading(false)
    if (updateError) {
      setError("Failed to save profile: " + updateError.message)
      return
    }
    setStep(3)
    setTimeout(() => router.push("/dashboard"), 1800)
  }

  // ── render step 1: role selection ─────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">I am a…</h2>
          <p className="text-[#94A3B8] text-sm">Select all that apply — you can switch between roles anytime</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ROLES.map(role => {
            const Icon = role.icon
            const selected = selectedRoles.includes(role.id as RoleId)
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id as RoleId)}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-left bg-gradient-to-br cursor-pointer ${
                  selected
                    ? `${role.bg} ${role.border} shadow-lg`
                    : "bg-[#1E293B]/60 border-[#334155] hover:border-[#475569]"
                }`}
              >
                {selected && (
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${role.check} flex items-center justify-center`}>
                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}22` }}
                >
                  <Icon className="h-7 w-7" style={{ color: role.color }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white mb-1">{role.label}</p>
                  <p className="text-[#94A3B8] text-xs leading-snug">{role.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <Button
          onClick={() => setStep(2)}
          disabled={selectedRoles.length === 0}
          className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20 disabled:opacity-40"
        >
          Continue <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    )
  }

  // ── render step 3: success ─────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-[#94A3B8]">Taking you to your dashboard…</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── render step 2: profile fields ─────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* progress */}
      <div className="flex items-center gap-2 text-sm">
        <button type="button" onClick={() => setStep(1)} className="text-[#6366F1] hover:underline text-xs">
          ← Back
        </button>
        <div className="flex-1 h-1 rounded-full bg-[#1E293B]">
          <div className="h-1 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] w-2/3" />
        </div>
        <span className="text-[#94A3B8] text-xs">Step 2 of 2</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedRoles.map(r => {
          const role = ROLES.find(x => x.id === r)!
          return (
            <span key={r} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${role.color}22`, color: role.color, border: `1px solid ${role.color}44` }}>
              {role.label}
            </span>
          )
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* ── COMMON FIELDS ────────────────────────────────────────────── */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide opacity-60">Basic Info</h3>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#6366F1]/20 flex items-center justify-center">
              {formData.avatar_url
                ? <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-[#A5B4FC]">{formData.full_name?.[0]?.toUpperCase() || "?"}</span>
              }
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center cursor-pointer hover:bg-[#4F46E5] transition-colors">
              <Camera className="h-3.5 w-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
          </div>
          {!formData.avatar_url && (
            <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
              Profiles with photos get 5× more responses
            </p>
          )}
          {uploading && <p className="text-[#94A3B8] text-xs">Uploading…</p>}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label className="text-[#F8FAFC] font-medium">Full Name *</Label>
          <Input
            value={formData.full_name}
            onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Your full name"
            required
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11"
          />
        </div>

        {/* Phone + Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#F8FAFC] font-medium">Phone *</Label>
            <div className="flex">
              <span className="flex items-center px-3 bg-[#334155] border border-r-0 border-[#334155] rounded-l-md text-[#94A3B8] text-sm">+91</span>
              <Input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                placeholder="10-digit number"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11 rounded-l-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#F8FAFC] font-medium">Location</Label>
            <Input
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Mumbai, India"
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label className="text-[#F8FAFC] font-medium">Bio</Label>
          <Textarea
            value={formData.bio}
            onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell others about yourself…"
            rows={3}
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1]"
          />
        </div>
      </div>

      {/* ── FREELANCER FIELDS ─────────────────────────────────────────── */}
      {isFreelancer && (
        <div className="bg-[#1E293B] border border-[#1D9E75]/30 rounded-2xl p-6 space-y-5">
          <h3 className="text-[#1D9E75] font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Freelancer Profile
          </h3>

          {/* Job Function */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[#F8FAFC] font-medium">What do you do? <span className="text-[#94A3B8] font-normal text-xs">(up to 5)</span></Label>
              {formData.job_function.length > 0 && <span className="text-[#6366F1] text-xs">{formData.job_function.length}/5</span>}
            </div>
            {formData.job_function.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.job_function.map(fn => (
                  <Badge key={fn} className="bg-[#6366F1]/20 text-[#A5B4FC] border-[#6366F1]/40 px-3 py-1 gap-1.5">
                    {fn}
                    <button type="button" onClick={() => toggleJobFunction(fn)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input value={jfSearch} onChange={e => setJfSearch(e.target.value)} placeholder="Search job functions…"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-9 pl-9 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredJF.map(fn => (
                <button key={fn} type="button" onClick={() => toggleJobFunction(fn)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    formData.job_function.includes(fn)
                      ? "bg-[#6366F1] text-white border-[#6366F1]"
                      : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-white"
                  }`}>
                  {fn}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[#F8FAFC] font-medium">Skills * <span className="text-[#94A3B8] font-normal text-xs">(up to 20)</span></Label>
              {formData.skills.length > 0 && <span className="text-[#06B6D4] text-xs">{formData.skills.length} selected</span>}
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <Badge key={skill} className="bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 gap-1">
                    {skill}
                    <button type="button" onClick={() => toggleSkill(skill)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search all skills…"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-9 pl-9 text-sm" />
            </div>
            {!skillSearch && (
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(SKILLS_BY_CATEGORY).map(cat => (
                  <button key={cat} type="button" onClick={() => setSkillCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      skillCategory === cat ? "bg-[#06B6D4] text-white border-[#06B6D4]" : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#06B6D4]/50"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredSkills.map(skill => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                  className="px-3 py-1.5 rounded-full text-sm border bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#06B6D4]/50 hover:text-[#06B6D4] transition-all">
                  + {skill}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCustomSkill() } }}
                placeholder="Custom skill (press Enter)"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] text-sm" />
              <Button type="button" onClick={addCustomSkill} disabled={!skillInput.trim()}
                className="bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <Label className="text-[#F8FAFC] font-medium">Portfolio Links</Label>
            <div className="space-y-2 mb-2">
              {formData.portfolio_links.map(link => (
                <div key={link} className="flex items-center justify-between bg-[#0F172A] px-3 py-2 rounded-lg border border-[#334155]">
                  <span className="text-[#A5B4FC] text-sm truncate">{link}</span>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, portfolio_links: prev.portfolio_links.filter(l => l !== link) }))}
                    className="text-[#94A3B8] hover:text-red-400 ml-2 flex-shrink-0"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink() } }}
                placeholder="https://yourportfolio.com"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              <Button type="button" onClick={addLink} disabled={!linkInput.trim()}
                className="bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOB SEEKER FIELDS ─────────────────────────────────────────── */}
      {isJobSeeker && (
        <div className="bg-[#1E293B] border border-[#378ADD]/30 rounded-2xl p-6 space-y-5">
          <h3 className="text-[#378ADD] font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Job Seeker Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Years of Experience</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={e => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                placeholder="e.g. 3"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#378ADD] h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">LinkedIn Profile</Label>
              <Input
                value={formData.linkedin_url}
                onChange={e => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="linkedin.com/in/yourname"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#378ADD] h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#F8FAFC] font-medium">Work Experience Summary</Label>
            <Textarea
              value={formData.experience_description}
              onChange={e => setFormData(prev => ({ ...prev, experience_description: e.target.value }))}
              placeholder="Briefly describe your past roles, responsibilities, and achievements…"
              rows={3}
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#378ADD]"
            />
          </div>
        </div>
      )}

      {/* ── EMPLOYER FIELDS ───────────────────────────────────────────── */}
      {isEmployer && (
        <div className="bg-[#1E293B] border border-[#F59E0B]/30 rounded-2xl p-6 space-y-5">
          <h3 className="text-[#F59E0B] font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Company Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Company Name *</Label>
              <Input
                value={formData.company_name}
                onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Acme Technologies"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#F59E0B] h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Company Size</Label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map(s => (
                  <button key={s} type="button" onClick={() => setFormData(prev => ({ ...prev, company_size: s }))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      formData.company_size === s
                        ? "bg-[#F59E0B] text-black border-[#F59E0B] font-semibold"
                        : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#F59E0B]/50 hover:text-white"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Company Website</Label>
              <Input
                value={formData.company_website}
                onChange={e => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                placeholder="https://yourcompany.com"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#F59E0B] h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Industry</Label>
              <select
                value={formData.industry}
                onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#334155] text-[#F8FAFC] rounded-md h-11 px-3 text-sm focus:border-[#F59E0B] focus:outline-none"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !formData.full_name.trim()}
        className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
      >
        {loading ? "Setting up your profile…" : "Complete Setup →"}
      </Button>
    </form>
  )
}
