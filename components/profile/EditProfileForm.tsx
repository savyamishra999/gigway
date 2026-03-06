"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Link as LinkIcon, Plus, X } from "lucide-react"
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
  id: string
  full_name: string | null
  bio: string | null
  skills: string[] | null
  hourly_rate: number | null
  user_type: string | null
  avatar_url: string | null
}

interface PortfolioLink {
  title: string
  url: string
}

export default function EditProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    skills: profile?.skills?.join(", ") || "",
    hourly_rate: profile?.hourly_rate || "",
    user_type: profile?.user_type || "freelancer",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([])
  const [newLink, setNewLink] = useState({ title: "", url: "" })
  const [loading, setLoading] = useState(false)
  const [showRoleWarning, setShowRoleWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return profile?.avatar_url || null

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const addPortfolioLink = () => {
    if (newLink.title && newLink.url) {
      setPortfolioLinks([...portfolioLinks, newLink])
      setNewLink({ title: "", url: "" })
    }
  }

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Upload avatar if changed
    let avatarUrl = profile?.avatar_url
    if (avatarFile) {
      avatarUrl = await uploadAvatar()
    }

    const skillsArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const updates: any = {
      full_name: formData.full_name,
      bio: formData.bio,
      skills: skillsArray,
      user_type: formData.user_type,
      avatar_url: avatarUrl,
    }

    if (formData.user_type === "freelancer" || formData.user_type === "both") {
      updates.hourly_rate = formData.hourly_rate ? parseFloat(String(formData.hourly_rate)) : null
    } else {
      updates.hourly_rate = null
    }

    // Update profile
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    // Add portfolio links if any
    if (portfolioLinks.length > 0) {
      const portfolioData = portfolioLinks.map(link => ({
        freelancer_id: userId,
        title: link.title,
        live_url: link.url,
      }))
      await supabase.from("portfolio_items").insert(portfolioData)
    }

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
        {/* Avatar Upload Section */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <Label className="text-white mb-4 block">Profile Photo</Label>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-[#FFD700]/20">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="bg-[#FFD700] text-black text-2xl">
                  {formData.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-white/20 text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info Card */}
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

        {/* Portfolio Links Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6 space-y-4">
            <Label className="text-white">Portfolio Links</Label>
            
            {/* Existing Links */}
            {portfolioLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                <LinkIcon className="h-4 w-4 text-[#FFD700]" />
                <span className="flex-1 text-white text-sm">{link.title}</span>
                <span className="text-gray-400 text-sm truncate max-w-[150px]">{link.url}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePortfolioLink(index)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}

            {/* Add New Link */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Title (e.g. Personal Website)"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                className="bg-white/50 md:col-span-1"
              />
              <Input
                placeholder="URL (e.g. https://myportfolio.com)"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="bg-white/50 md:col-span-1"
              />
              <Button
                type="button"
                onClick={addPortfolioLink}
                disabled={!newLink.title || !newLink.url}
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black md:col-span-1"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
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