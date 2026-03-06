"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function ProjectForm({ userId }: { userId: string }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    customCategory: "",
    skills: "",
    budget: "",
    description: "",
  })
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFormData({ ...formData, category: value })
    setShowCustomCategory(value === "other")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const skillsArray = formData.skills
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)

    const finalCategory = formData.category === "other" 
      ? formData.customCategory 
      : formData.category

    if (!finalCategory) {
      alert("Please select or enter a category")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("projects").insert({
      client_id: userId,
      title: formData.title,
      description: formData.description,
      budget: parseFloat(formData.budget),
      category: finalCategory,
      skills_required: skillsArray,
      status: "open",
    })

    setLoading(false)
    if (error) {
      alert("Error posting project: " + error.message)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <Card className="bg-white/30 backdrop-blur-lg border-white/20">
      <CardContent className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Post a New Project</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Build an E-commerce Website"
              required
              className="bg-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={handleCategoryChange}
              required
              className="w-full p-2 rounded-md bg-white/50 border border-gray-300"
            >
              <option value="">Select category</option>
              <option value="web-dev">Web Development</option>
              <option value="mobile-app">Mobile App Development</option>
              <option value="design">Graphic Design</option>
              <option value="ui-ux">UI/UX Design</option>
              <option value="ai-ml">AI/ML</option>
              <option value="content">Content Writing</option>
              <option value="digital-marketing">Digital Marketing</option>
              <option value="video-editing">Video Editing</option>
              <option value="translation">Translation</option>
              <option value="other">Other (please specify)</option>
            </select>
            {showCustomCategory && (
              <Input
                type="text"
                placeholder="Enter your custom category"
                value={formData.customCategory}
                onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                className="mt-2 bg-white/50"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills Required (comma separated)</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="e.g. React, Node.js, MongoDB"
              className="bg-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="e.g. 50000"
              required
              className="bg-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project in detail..."
              rows={6}
              required
              className="bg-white/50"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
            >
              {loading ? "Posting..." : "Post Project"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}