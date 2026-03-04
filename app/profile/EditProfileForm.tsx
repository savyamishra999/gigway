"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface Profile {
  full_name: string | null
  bio: string | null
  skills: string[] | null
  hourly_rate: number | null
  user_type: string | null
}

export default function EditProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    skills: profile?.skills?.join(", ") || "",
    hourly_rate: profile?.hourly_rate || "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const skillsArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const updates: any = {
      full_name: formData.full_name,
      bio: formData.bio,
      skills: skillsArray,
    }

    if (profile?.user_type === "freelancer" || profile?.user_type === "both") {
      updates.hourly_rate = parseFloat(formData.hourly_rate) || null
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    setLoading(false)
    if (error) {
      alert("Error updating profile: " + error.message)
    } else {
      router.push("/profile")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma separated)</Label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, UI/UX"
            />
          </div>

          {(profile?.user_type === "freelancer" || profile?.user_type === "both") && (
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min="0"
                step="50"
                value={formData.hourly_rate}
                onChange={handleChange}
                placeholder="e.g. 500"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>User Type</Label>
            <Input value={profile?.user_type || ""} disabled className="bg-gray-100" />
            <p className="text-sm text-gray-500">To change your role, please contact support.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}