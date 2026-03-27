"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", "Django",
  "PostgreSQL", "MongoDB", "GraphQL", "REST API", "Tailwind CSS", "Figma",
  "UI/UX Design", "Photoshop", "Illustrator", "Content Writing", "SEO",
  "Digital Marketing", "Video Editing", "React Native", "Flutter", "Java",
  "Swift", "Go", "Rust", "PHP", "Laravel", "WordPress",
]

const JOB_FUNCTIONS = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "UI/UX Designer", "Graphic Designer", "Mobile Developer",
  "Data Scientist", "DevOps Engineer", "Content Writer", "Digital Marketer",
  "Video Editor", "SEO Specialist", "WordPress Developer", "Other",
]

export default function OnboardingForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    job_function: "",
    bio: "",
    location: "",
    phone: "",
    hourly_rate: "",
    skills: [] as string[],
    portfolio_links: [] as string[],
  })
  const router = useRouter()
  const supabase = createClient()

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setSkillInput("")
  }

  const removeSkill = (skill: string) =>
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))

  const addLink = () => {
    const trimmed = linkInput.trim()
    if (trimmed && !formData.portfolio_links.includes(trimmed)) {
      setFormData(prev => ({ ...prev, portfolio_links: [...prev.portfolio_links, trimmed] }))
      setLinkInput("")
    }
  }

  const removeLink = (link: string) =>
    setFormData(prev => ({ ...prev, portfolio_links: prev.portfolio_links.filter(l => l !== link) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) { setError("Full name is required"); return }
    setLoading(true)
    setError("")

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name.trim(),
        job_function: formData.job_function || null,
        bio: formData.bio || null,
        location: formData.location || null,
        phone: formData.phone || null,
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
    <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Full Name */}
      <div className="space-y-2">
        <Label className="text-[#F8FAFC] font-medium">Full Name *</Label>
        <Input
          value={formData.full_name}
          onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="e.g. Priya Sharma"
          required
          className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11"
        />
      </div>

      {/* Job Function */}
      <div className="space-y-2">
        <Label className="text-[#F8FAFC] font-medium">What do you do?</Label>
        <div className="flex flex-wrap gap-2">
          {JOB_FUNCTIONS.map(fn => (
            <button
              key={fn}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, job_function: fn }))}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                formData.job_function === fn
                  ? "bg-[#6366F1] text-white border-[#6366F1]"
                  : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#6366F1]/50 hover:text-white"
              }`}
            >
              {fn}
            </button>
          ))}
        </div>
        {formData.job_function === "Other" && (
          <Input
            placeholder="Describe what you do"
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1] h-11 mt-2"
            onBlur={e => setFormData(prev => ({ ...prev, job_function: e.target.value || "Other" }))}
          />
        )}
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

      {/* Location + Phone */}
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
      <div className="space-y-2">
        <Label className="text-[#F8FAFC] font-medium">Skills</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.skills.map(skill => (
            <Badge key={skill} className="bg-[#6366F1]/20 text-[#A5B4FC] border-[#6366F1]/30 flex items-center gap-1">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput) }
            }}
            placeholder="Type a skill and press Enter"
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1]"
          />
          <Button type="button" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}
            className="bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {SKILL_SUGGESTIONS.filter(s => !formData.skills.includes(s)).slice(0, 10).map(s => (
            <button key={s} type="button" onClick={() => addSkill(s)}
              className="text-xs px-2 py-1 rounded-full bg-[#0F172A] text-[#94A3B8] hover:bg-[#6366F1]/20 hover:text-[#A5B4FC] border border-[#334155] transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Links */}
      <div className="space-y-2">
        <Label className="text-[#F8FAFC] font-medium">Portfolio Links</Label>
        <div className="space-y-2 mb-2">
          {formData.portfolio_links.map(link => (
            <div key={link} className="flex items-center justify-between bg-[#0F172A] px-3 py-2 rounded-lg border border-[#334155]">
              <span className="text-[#A5B4FC] text-sm truncate">{link}</span>
              <button type="button" onClick={() => removeLink(link)} className="text-[#94A3B8] hover:text-red-400 ml-2 flex-shrink-0">
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
            className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#6366F1]"
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
