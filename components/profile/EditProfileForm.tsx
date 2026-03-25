"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, ExternalLink } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Profile {
  id: string
  full_name: string | null
  tagline?: string | null
  bio: string | null
  skills: string[] | null
  hourly_rate: number | null
  user_type: string | null
  avatar_url: string | null
  location?: string | null
  company?: string | null
  phone?: string | null
  availability?: string | null
  portfolio_links?: string[] | null
}

const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python",
  "PostgreSQL", "MongoDB", "GraphQL", "Tailwind CSS", "Figma", "UI/UX Design",
  "Content Writing", "SEO", "Digital Marketing", "Video Editing",
]

export default function EditProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const isFreelancer = profile?.user_type === "freelancer" || profile?.user_type === "both"
  const isClient = profile?.user_type === "client"

  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [tagline, setTagline] = useState(profile?.tagline || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [location, setLocation] = useState(profile?.location || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate?.toString() || "")
  const [availability, setAvailability] = useState(profile?.availability || "")
  const [company, setCompany] = useState(profile?.company || "")
  const [skills, setSkills] = useState<string[]>(profile?.skills || [])
  const [skillInput, setSkillInput] = useState("")
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(profile?.portfolio_links || [])
  const [linkInput, setLinkInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed])
    }
    setSkillInput("")
  }

  const removeSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill))

  const addLink = () => {
    const trimmed = linkInput.trim()
    if (trimmed && !portfolioLinks.includes(trimmed)) {
      setPortfolioLinks(prev => [...prev, trimmed])
      setLinkInput("")
    }
  }

  const removeLink = (link: string) => setPortfolioLinks(prev => prev.filter(l => l !== link))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const updates: Record<string, unknown> = {
      full_name: fullName,
      bio: bio || null,
      location: location || null,
    }

    if (isFreelancer) {
      updates.tagline = tagline || null
      updates.phone = phone || null
      updates.skills = skills
      updates.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null
      updates.availability = availability || null
      updates.portfolio_links = portfolioLinks
    }

    if (isClient) {
      updates.company = company || null
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    setLoading(false)
    if (error) {
      setMessage({ type: "error", text: "Error saving profile: " + error.message })
    } else {
      setMessage({ type: "success", text: "Profile saved successfully!" })
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg border text-sm font-medium ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="border-b border-white/10 pb-3">
          <CardTitle className="text-white text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Full Name *</Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Location</Label>
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
          </div>

          {isClient && (
            <div className="space-y-2">
              <Label className="text-gray-300">Company</Label>
              <Input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Company name"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300">Bio</Label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Freelancer Fields */}
      {isFreelancer && (
        <>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10 pb-3">
              <CardTitle className="text-white text-lg">Freelancer Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Tagline</Label>
                <Input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Full-Stack Developer | 5+ years"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Hourly Rate (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(e.target.value)}
                    placeholder="e.g. 500"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Availability</Label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="weekends">Weekends Only</SelectItem>
                    <SelectItem value="not-available">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10 pb-3">
              <CardTitle className="text-white text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <Badge
                    key={skill}
                    className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 flex items-center gap-1 px-3 py-1"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addSkill(skillInput)
                    }
                  }}
                  placeholder="Add a skill (press Enter)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                />
                <Button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  disabled={!skillInput.trim()}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
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
            </CardContent>
          </Card>

          {/* Portfolio Links */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10 pb-3">
              <CardTitle className="text-white text-lg">Portfolio Links</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                {portfolioLinks.map(link => (
                  <div
                    key={link}
                    className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg border border-white/10"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD700] text-sm truncate flex items-center gap-2 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      {link}
                    </a>
                    <button type="button" onClick={() => removeLink(link)} className="text-gray-500 hover:text-red-400 ml-2">
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
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
                />
                <Button
                  type="button"
                  onClick={addLink}
                  disabled={!linkInput.trim()}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-white/20 text-gray-300 hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !fullName}
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold px-8"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
