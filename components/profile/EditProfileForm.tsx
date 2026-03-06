"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
    user_type: profile?.user_type || "freelancer",
  })
  const [loading, setLoading] = useState(false)
  const [showRoleWarning, setShowRoleWarning] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    if (profile?.user_type && profile.user_type !== value) {
      setShowRoleWarning(true)
      setFormData((prev) => ({ ...prev, user_type: value }))
    }
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
      user_type: formData.user_type,
    }

    if (formData.user_type === "freelancer" || formData.user_type === "both") {
      updates.hourly_rate = parseFloat(formData.hourly_rate) || null
    } else {
      updates.hourly_rate = null
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
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-white">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className="bg-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={4}
                className="bg-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-white">Skills (comma separated)</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. React, Node.js, UI/UX"
                className="bg-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type" className="text-white">I want to work as</Label>
              <Select value={formData.user_type} onValueChange={handleRoleChange}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="both">Both (Hybrid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.user_type === "freelancer" || formData.user_type === "both") && (
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-white">Hourly Rate (₹)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="bg-white/50"
                />
              </div>
            )}
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

      {/* Role Change Warning Dialog */}
      <AlertDialog open={showRoleWarning} onOpenChange={setShowRoleWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing your role may affect your proposals, projects, and how others see you on the platform.
              This action can be reversed by changing your role again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowRoleWarning(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}