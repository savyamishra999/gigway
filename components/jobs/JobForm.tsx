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
import { X, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CATEGORIES = [
  "Web Development", "Mobile Development", "Design", "Marketing",
  "Writing", "Data Science", "Finance", "Sales", "HR", "Operations", "Other",
]

export default function JobForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [location, setLocation] = useState("")
  const [jobType, setJobType] = useState("full-time")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [category, setCategory] = useState("")
  const [experienceRequired, setExperienceRequired] = useState("")
  const [deadline, setDeadline] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed])
    }
    setSkillInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) { setError("Please select a category"); return }
    setLoading(true)
    setError("")

    const { data, error: insertError } = await supabase
      .from("jobs")
      .insert({
        poster_id: userId,
        client_id: userId,
        title,
        description,
        company_name: companyName || null,
        location: location || null,
        job_type: jobType,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        skills_required: skills,
        category,
        experience_required: experienceRequired || null,
        deadline: deadline || null,
        status: "active",
      })
      .select("id")
      .single()

    setLoading(false)
    if (insertError) {
      setError("Error posting job: " + insertError.message)
      return
    }
    router.push(`/jobs/${data.id}`)
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white text-2xl">Post a Job</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300">Job Title *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior React Developer"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Company Name</Label>
            <Input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Description *</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, requirements..."
              rows={6}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, "-")}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Job Type *</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Location</Label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, India or Remote"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Salary Min (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                  placeholder="e.g. 500000"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Salary Max (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={e => setSalaryMax(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] pl-7"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Experience Required</Label>
            <Input
              value={experienceRequired}
              onChange={e => setExperienceRequired(e.target.value)}
              placeholder="e.g. 2+ years in React development"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Application Deadline</Label>
            <Input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-white/5 border-white/10 text-white focus:border-[#FFD700]"
            />
          </div>

          {/* Skills Required */}
          <div className="space-y-2">
            <Label className="text-gray-300">Skills Required</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map(skill => (
                <Badge
                  key={skill}
                  className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 flex items-center gap-1"
                >
                  {skill}
                  <button type="button" onClick={() => setSkills(prev => prev.filter(s => s !== skill))}>
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
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    addSkill(skillInput)
                  }
                }}
                placeholder="Add required skill (press Enter)"
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
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-8"
            >
              {loading ? "Posting..." : "Post Job"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
