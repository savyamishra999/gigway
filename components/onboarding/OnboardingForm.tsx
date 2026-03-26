"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, X, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", "Django",
  "PostgreSQL", "MongoDB", "GraphQL", "REST API", "Tailwind CSS", "Figma",
  "UI/UX Design", "Photoshop", "Illustrator", "Content Writing", "SEO",
  "Digital Marketing", "Video Editing", "React Native", "Flutter", "Java",
  "Swift", "Go", "Rust", "PHP", "Laravel", "WordPress",
]

export default function OnboardingForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"freelancer" | "client" | null>(null)
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    tagline: "",
    bio: "",
    location: "",
    phone: "",
    skills: [] as string[],
    hourlyRate: "",
    availability: "",
    company: "",
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

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return
    setLoading(true)

    const updates: Record<string, unknown> = {
      user_type: role,
      full_name: formData.fullName,
      bio: formData.bio || null,
      location: formData.location || null,
    }

    if (role === "freelancer") {
      updates.tagline = formData.tagline || null
      updates.phone = formData.phone || null
      updates.skills = formData.skills
      updates.hourly_rate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null
      updates.availability = formData.availability || null
    } else {
      updates.company = formData.company || null
    }

    updates.profile_completed = true
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    setLoading(false)
    if (error) {
      alert("Error saving profile: " + error.message)
    } else {
      router.push("/dashboard")
    }
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer p-6 border-2 transition-all ${
              role === "freelancer"
                ? "border-[#FFD700] bg-[#FFD700]/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
            onClick={() => setRole("freelancer")}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">I&apos;m a Freelancer</h3>
            <p className="text-sm text-gray-400">I want to find work and earn money</p>
          </Card>

          <Card
            className={`cursor-pointer p-6 border-2 transition-all ${
              role === "client"
                ? "border-[#FFD700] bg-[#FFD700]/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
            onClick={() => setRole("client")}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">I&apos;m a Client</h3>
            <p className="text-sm text-gray-400">I want to hire freelancers for my projects</p>
          </Card>
        </div>

        <Button
          onClick={() => setStep(2)}
          disabled={!role}
          className="w-full py-6 text-lg font-semibold bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
        >
          Continue &rarr;
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">
          {role === "freelancer" ? "Freelancer" : "Client"}
        </Badge>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-gray-400 hover:text-white underline"
        >
          Change
        </button>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label className="text-gray-300">Full Name *</Label>
        <Input
          value={formData.fullName}
          onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="e.g. Mohit Sharma"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
        />
      </div>

      {role === "freelancer" && (
        <>
          {/* Tagline */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tagline</Label>
            <Input
              value={formData.tagline}
              onChange={e => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="e.g. Full-Stack Developer | React Expert"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-gray-300">Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell clients about yourself..."
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          {/* Location + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Location</Label>
              <Input
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Mumbai, India"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Phone</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 9876543210"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label className="text-gray-300">Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map(skill => (
                <Badge
                  key={skill}
                  className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 flex items-center gap-1"
                >
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
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
              <Button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10"
                disabled={!skillInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {SKILL_SUGGESTIONS.filter(s => !formData.skills.includes(s)).slice(0, 8).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 hover:bg-[#FFD700]/20 hover:text-[#FFD700] border border-white/10 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Rate + Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Hourly Rate (₹)</Label>
              <Input
                type="number"
                min="0"
                value={formData.hourlyRate}
                onChange={e => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="e.g. 500"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Availability</Label>
              <Select
                value={formData.availability}
                onValueChange={v => setFormData(prev => ({ ...prev, availability: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="weekends">Weekends Only</SelectItem>
                  <SelectItem value="not-available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {role === "client" && (
        <>
          {/* Company */}
          <div className="space-y-2">
            <Label className="text-gray-300">Company</Label>
            <Input
              value={formData.company}
              onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="e.g. Acme Corp"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-gray-300">Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell freelancers about your company and projects..."
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-gray-300">Location</Label>
            <Input
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Bangalore, India"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={loading || !formData.fullName}
        className="w-full py-6 text-lg font-semibold bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
      >
        {loading ? "Saving..." : "Complete Setup →"}
      </Button>
    </form>
  )
}
