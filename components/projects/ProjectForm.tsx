"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  { value: "web-dev", label: "Web Development" },
  { value: "design", label: "Design" },
  { value: "mobile", label: "Mobile App" },
  { value: "writing", label: "Writing" },
  { value: "marketing", label: "Marketing" },
  { value: "video", label: "Video / Animation" },
  { value: "data", label: "Data / Analytics" },
  { value: "other", label: "Other" },
]

export default function ProjectForm({ userId, organizations = [] }: { userId: string; organizations?: { id: string; name: string; entity_type: "company" | "organization" }[] }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [projectType, setProjectType] = useState<"fixed" | "hourly">("fixed")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skillsRequired, setSkillsRequired] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const router = useRouter()

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skillsRequired.includes(trimmed)) {
      setSkillsRequired(prev => [...prev, trimmed])
    }
    setSkillInput("")
  }

  const removeSkill = (skill: string) => setSkillsRequired(prev => prev.filter(s => s !== skill))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) { setError("Please select a category"); return }
    if (!budget || parseFloat(budget) <= 0) { setError("Please enter a valid budget"); return }
    setLoading(true)
    setError("")

    const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, category, project_type: projectType, budget, deadline, skills_required: skillsRequired, organizationId: organizationId || undefined }) })
    const data = await response.json().catch(() => ({})); setLoading(false)
    if (!response.ok) setError(data.error === "upgrade_required" ? "Your free project slot is already active. Upgrade to GigWay Business for more hiring capacity." : data.error || "Unable to post project.")
    else router.push(`/projects/${data.project_id}`)
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white text-2xl">Post a New Project</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {organizations.length > 0 && <div className="space-y-2"><Label className="text-gray-300">Posting as</Label><Select value={organizationId || "personal"} onValueChange={value => setOrganizationId(value === "personal" ? "" : value)}><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1a1a] border-white/10 text-white"><SelectItem value="personal">Personal account</SelectItem>{organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name} · {org.entity_type === "company" ? "Company" : "Organization"}</SelectItem>)}</SelectContent></Select></div>}

          <div className="space-y-2">
            <Label className="text-gray-300">Project Title *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Build an E-commerce Website"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Description *</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your project requirements in detail..."
              rows={5}
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
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Project Type *</Label>
              <Select value={projectType} onValueChange={(v: "fixed" | "hourly") => setProjectType(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Budget (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="50000"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFD700] pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Deadline</Label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-white/5 border-white/10 text-white focus:border-[#FFD700]"
              />
            </div>
          </div>

          {/* Skills Required */}
          <div className="space-y-2">
            <Label className="text-gray-300">Skills Required</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skillsRequired.map(skill => (
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

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold px-8"
            >
              {loading ? "Posting..." : "Post Project"}
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
