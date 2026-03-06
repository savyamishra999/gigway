"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, LinkIcon, Plus, X, Globe, Github, Twitter, Linkedin } from "lucide-react"
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
  experience_years?: number | null
  location?: string | null
  company?: string | null
}

interface PortfolioLink {
  title: string
  url: string
  type: "website" | "github" | "linkedin" | "twitter" | "other"
}

export default function EditProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    skills: profile?.skills?.join(", ") || "",
    hourly_rate: profile?.hourly_rate || "",
    user_type: profile?.user_type || "freelancer",
    experience_years: profile?.experience_years || "",
    location: profile?.location || "",
    company: profile?.company || "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([])
  const [newLink, setNewLink] = useState({ title: "", url: "", type: "website" as const })
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

  const getLinkIcon = (type: string) => {
    switch(type) {
      case 'github': return <Github className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  }

  const addPortfolioLink = () => {
    if (newLink.title && newLink.url) {
      setPortfolioLinks([...portfolioLinks, newLink])
      setNewLink({ title: "", url: "", type: "website" })
    }
  }

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
      experience_years: formData.experience_years ? parseInt(String(formData.experience_years)) : null,
      location: formData.location || null,
      company: formData.company || null,
    }

    if (formData.user_type === "freelancer" || formData.user_type === "both") {
      updates.hourly_rate = formData.hourly_rate ? parseFloat(String(formData.hourly_rate)) : null
    } else {
      updates.hourly_rate = null
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (portfolioLinks.length > 0) {
      const portfolioData = portfolioLinks.map(link => ({
        freelancer_id: userId,
        title: link.title,
        live_url: link.url,
        type: link.type,
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
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Avatar Upload Card - Clean White */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-500" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 ring-2 ring-gray-200">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl">
                  {formData.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
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
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-500">JPG, PNG, GIF up to 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info Card - Clean White */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <span>📋</span> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Mohit Sharma"
                  required
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, India"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-medium text-gray-700">Skills (comma separated)</Label>
                <Input
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, UI/UX"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">Company (if any)</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Google, Self-employed"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_type" className="text-sm font-medium text-gray-700">I want to work as *</Label>
                <Select value={formData.user_type} onValueChange={handleRoleChange}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freelancer">🎯 Freelancer</SelectItem>
                    <SelectItem value="client">💼 Client</SelectItem>
                    <SelectItem value="both">🔄 Both (Hybrid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_years" className="text-sm font-medium text-gray-700">Years of Experience</Label>
                <Input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
            </div>

            {(formData.user_type === "freelancer" || formData.user_type === "both") && (
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-sm font-medium text-gray-700">Hourly Rate (₹)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Links Card - Clean White */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-gray-500" />
              Portfolio Links
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {/* Existing Links */}
            {portfolioLinks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Your Links</Label>
                <div className="space-y-2">
                  {portfolioLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-200 rounded-full text-gray-600">
                          {getLinkIcon(link.type)}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{link.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{link.url}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePortfolioLink(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Link Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Add New Link</Label>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Title (e.g. Personal Website)"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
                <Input
                  placeholder="URL (e.g. https://myportfolio.com)"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
                <Select
                  value={newLink.type}
                  onValueChange={(value: any) => setNewLink({ ...newLink, type: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Link Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">🌐 Website</SelectItem>
                    <SelectItem value="github">🐙 GitHub</SelectItem>
                    <SelectItem value="linkedin">🔗 LinkedIn</SelectItem>
                    <SelectItem value="twitter">🐦 Twitter</SelectItem>
                    <SelectItem value="other">📌 Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={addPortfolioLink}
                  disabled={!newLink.title || !newLink.url}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Role Change Warning Dialog */}
      <AlertDialog open={showRoleWarning} onOpenChange={setShowRoleWarning}>
        <AlertDialogContent className="border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Changing your role may affect your proposals, projects, and how others see you on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setShowRoleWarning(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}