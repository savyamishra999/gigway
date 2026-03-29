"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Search } from "lucide-react"

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

export default function OnboardingForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skillSearch, setSkillSearch] = useState("")
  const [skillCategory, setSkillCategory] = useState("Development")
  const [linkInput, setLinkInput] = useState("")
  const [jfSearch, setJfSearch] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    job_function: [] as string[],
    bio: "",
    location: "",
    hourly_rate: "",
    skills: [] as string[],
    portfolio_links: [] as string[],
  })
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

  const addCustomSkill = (skill: string) => {
    const trimmed = skill.trim()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) { setError("Full name is required"); return }
    setLoading(true)
    setError("")

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name.trim(),
        job_function: formData.job_function.length > 0 ? formData.job_function : null,
        bio: formData.bio || null,
        location: formData.location || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        skills: formData.skills,
        portfolio_links: formData.portfolio_links,
        profile_completed: true,
      })
      .eq("id", userId)

    setLoading(false)
    if (updateError) {
      setError("Failed to save profile: " + updateError.message)
      return
    }
    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 space-y-7">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Full Name */}
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

      {/* Job Function Multi-select */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[#F8FAFC] font-medium">What do you do? <span className="text-[#94A3B8] font-normal">(select up to 5)</span></Label>
          {formData.job_function.length > 0 && (
            <span className="text-[#6366F1] text-xs">{formData.job_function.length}/5 selected</span>
          )}
        </div>

        {formData.job_function.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.job_function.map(fn => (
              <Badge key={fn} className="bg-[#6366F1]/20 text-[#A5B4FC] border-[#6366F1]/40 px-3 py-1 gap-1.5">
                {fn}
                <button type="button" onClick={() => toggleJobFunction(fn)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input
            value={jfSearch}
            onChange={e => setJfSearch(e.target.value)}
            placeholder="Search job functions..."
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-9 pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          {filteredJF.map(fn => (
            <button
              key={fn}
              type="button"
              onClick={() => toggleJobFunction(fn)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                formData.job_function.includes(fn)
                  ? "bg-[#6366F1] text-white border-[#6366F1]"
                  : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-white"
              }`}
            >
              {fn}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label className="text-[#F8FAFC] font-medium">Bio</Label>
        <Textarea
          value={formData.bio}
          onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell others about yourself, your experience, and what you're passionate about..."
          rows={3}
          className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1]"
        />
      </div>

      {/* Location + Rate */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#F8FAFC] font-medium">Location</Label>
          <Input
            value={formData.location}
            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. Mumbai, India"
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#F8FAFC] font-medium">Hourly Rate (₹)</Label>
          <Input
            type="number"
            min="0"
            value={formData.hourly_rate}
            onChange={e => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
            placeholder="e.g. 500"
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[#F8FAFC] font-medium">Skills <span className="text-[#94A3B8] font-normal">(up to 20)</span></Label>
          {formData.skills.length > 0 && (
            <span className="text-[#06B6D4] text-xs">{formData.skills.length} selected</span>
          )}
        </div>

        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills.map(skill => (
              <Badge key={skill} className="bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 gap-1">
                {skill}
                <button type="button" onClick={() => toggleSkill(skill)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input
            value={skillSearch}
            onChange={e => setSkillSearch(e.target.value)}
            placeholder="Search all skills..."
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-9 pl-9 text-sm"
          />
        </div>

        {/* Category tabs (hidden during search) */}
        {!skillSearch && (
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(SKILLS_BY_CATEGORY).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSkillCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  skillCategory === cat
                    ? "bg-[#06B6D4] text-white border-[#06B6D4]"
                    : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#06B6D4]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
          {filteredSkills.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className="px-3 py-1.5 rounded-full text-sm border bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#06B6D4]/50 hover:text-[#06B6D4] transition-all"
            >
              + {skill}
            </button>
          ))}
        </div>

        {/* Custom skill input */}
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCustomSkill(skillInput) }
            }}
            placeholder="Custom skill (press Enter)"
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] text-sm"
          />
          <Button type="button" onClick={() => addCustomSkill(skillInput)} disabled={!skillInput.trim()}
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
                className="text-[#94A3B8] hover:text-red-400 ml-2 flex-shrink-0">
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
            className="bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !formData.full_name.trim()}
        className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
      >
        {loading ? "Setting up your profile..." : "Complete Setup →"}
      </Button>
    </form>
  )
}
