"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CATEGORIES = [
  "Web Development", "Mobile Development", "Design", "Marketing",
  "Writing", "Data Science", "Finance", "Sales", "HR", "Operations", "Other",
]

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("")
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { id: resolvedId } = await params
      setId(resolvedId)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: job } = await supabase.from("jobs").select("*").eq("id", resolvedId).single()
      if (!job || job.client_id !== user.id) { router.push(`/jobs/${resolvedId}`); return }

      setTitle(job.title || "")
      setDescription(job.description || "")
      setCompanyName(job.company_name || "")
      setLocation(job.location || "")
      setJobType(job.job_type || "full-time")
      setSalaryMin(job.salary_min?.toString() || "")
      setSalaryMax(job.salary_max?.toString() || "")
      setCategory(job.category || "")
      setExperienceRequired(job.experience_required || "")
      setDeadline(job.deadline ? job.deadline.split("T")[0] : "")
      setSkills(job.skills_required || [])
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed])
    setSkillInput("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    const { error: updateError } = await supabase.from("jobs").update({
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
    }).eq("id", id)
    setSaving(false)
    if (updateError) { setError("Save failed: " + updateError.message); return }
    router.push(`/jobs/${id}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <p className="text-[#6B7280]">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="border-b border-[#1E1E2E] px-6 py-5">
            <h1 className="text-2xl font-black text-white">Edit Job</h1>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label className="text-[#9CA3AF]">Job Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#9CA3AF]">Company Name</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#9CA3AF]">Description *</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} required
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#0A0A0F] border-[#1E1E2E] text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121A] border-[#1E1E2E] text-white">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, "-")}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Job Type *</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="bg-[#0A0A0F] border-[#1E1E2E] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121A] border-[#1E1E2E] text-white">
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
              <Label className="text-[#9CA3AF]">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)}
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Salary Min (₹)</Label>
                <Input type="number" min="0" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Salary Max (₹)</Label>
                <Input type="number" min="0" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#9CA3AF]">Experience Required</Label>
              <Input value={experienceRequired} onChange={e => setExperienceRequired(e.target.value)}
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#9CA3AF]">Application Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white focus:border-[#4F46E5]" />
            </div>

            <div className="space-y-2">
              <Label className="text-[#9CA3AF]">Skills Required</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map(skill => (
                  <Badge key={skill} className="bg-[#4F46E5]/20 text-[#818CF8] border-[#4F46E5]/30 flex items-center gap-1">
                    {skill}
                    <button type="button" onClick={() => setSkills(prev => prev.filter(s => s !== skill))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput) }}}
                  placeholder="Add skill (press Enter)"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#4B5563] focus:border-[#4F46E5]" />
                <Button type="button" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}
                  className="bg-[#4F46E5]/20 text-[#818CF8] hover:bg-[#4F46E5]/30 border-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={saving}
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-8 hover:opacity-90">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}
                className="border-[#1E1E2E] text-[#6B7280] hover:bg-[#1E1E2E]">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
