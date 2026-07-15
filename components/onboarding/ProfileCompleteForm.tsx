"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Camera, FileText, X, Check, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education",
  "E-commerce / Retail", "Manufacturing", "Media & Entertainment",
  "Real Estate", "Logistics & Transport", "Food & Beverage",
  "Legal", "Consulting", "Non-Profit", "Government", "Other",
]

const COMPANY_SIZES = [
  "1–10 employees", "11–50 employees", "51–200 employees",
  "201–500 employees", "500+ employees",
]

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
  "Django", "PHP", "Laravel", "Java", "Flutter", "React Native",
  "UI/UX Design", "Figma", "Photoshop", "Illustrator", "After Effects",
  "Content Writing", "Copywriting", "SEO", "Digital Marketing",
  "Social Media", "Video Editing", "Data Analysis", "Excel", "SQL",
  "AWS", "DevOps", "Docker", "Project Management", "Sales",
  "HR", "Accounting", "Photography", "Graphic Design", "WordPress", "Canva",
]

interface FormData {
  full_name: string
  phone: string
  location: string
  bio: string
  avatar_url: string
  resume_url: string
  skills: string[]
  company_name: string
  industry: string
  company_size: string
  company_website: string
  gst_number: string
  work_needs: string
}

export default function ProfileCompleteForm({ userId }: { userId: string }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [roles, setRoles] = useState<string[]>([])
  const [accountType, setAccountType] = useState<"individual" | "company" | "">("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<"avatar" | "resume" | null>(null)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")

  const [form, setForm] = useState<FormData>({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    avatar_url: "",
    resume_url: "",
    skills: [],
    company_name: "",
    industry: "",
    company_size: "",
    company_website: "",
    gst_number: "",
    work_needs: "",
  })

  const router = useRouter()
  const supabase = createClient()

  const set = (key: keyof FormData, value: string | string[]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleRole = (role: string) =>
    setRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )

  const toggleSkill = (skill: string) =>
    setForm(prev => {
      if (prev.skills.includes(skill))
        return { ...prev, skills: prev.skills.filter(s => s !== skill) }
      if (prev.skills.length >= 20) return prev
      return { ...prev, skills: [...prev.skills, skill] }
    })

  const addCustomSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !form.skills.includes(trimmed) && form.skills.length < 20)
      setForm(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    setSkillInput("")
  }

  const uploadFile = async (file: File, bucket: string, type: "avatar" | "resume") => {
    setUploading(type)
    const ext = file.name.split(".").pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      set(type === "avatar" ? "avatar_url" : "resume_url", data.publicUrl)
    }
    setUploading(null)
  }

  const isFindWork   = roles.includes("find_work")
  const isHireTalent = roles.includes("hire_talent")
  const isCompany    = accountType === "company"
  const isIndividual = accountType === "individual"

  const validate = (): string | null => {
    if (!accountType) return "Select your account type"
    if (isCompany) {
      if (!form.company_name.trim()) return "Company name is required"
      if (!form.full_name.trim()) return "Contact person name is required"
      if (!form.phone.trim()) return "Phone number is required"
      if (!form.location.trim()) return "City is required"
      if (!form.industry) return "Industry is required"
      if (!form.company_size) return "Company size is required"
      const bioNeeded = isFindWork || isHireTalent
      if (bioNeeded && form.bio.trim().length < 30)
        return "About company must be at least 30 characters"
    } else {
      if (!form.full_name.trim()) return "Full name is required"
      if (!form.phone.trim()) return "Phone number is required"
      if (!form.location.trim()) return "City is required"
      if (isFindWork) {
        if (!form.avatar_url) return "Profile photo is required"
        if (form.skills.length === 0) return "Add at least 1 skill"
        if (form.bio.trim().length < 30) return "Bio must be at least 30 characters"
      }
    }
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: "smooth" }); return }

    setLoading(true)
    setError("")

    // Build bio: for hire-talent individual, include work_needs
    let bioValue = form.bio.trim() || null
    if (isHireTalent && isIndividual && form.work_needs.trim()) {
      bioValue = form.work_needs.trim()
    }

    // Store GST in experience_description
    const extraDesc = isHireTalent && isCompany && form.gst_number.trim()
      ? `GST: ${form.gst_number.trim()}`
      : null

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        user_roles:             roles,
        account_type:           accountType,
        full_name:              form.full_name.trim(),
        phone:                  form.phone.replace(/\D/g, ""),
        location:               form.location.trim(),
        bio:                    bioValue,
        avatar_url:             form.avatar_url || null,
        resume_url:             form.resume_url || null,
        skills:                 isFindWork ? form.skills : [],
        company_name:           form.company_name.trim() || null,
        industry:               form.industry || null,
        company_size:           form.company_size || null,
        company_website:        form.company_website.trim() || null,
        experience_description: extraDesc,
        profile_completed:      true,
      })
      .eq("id", userId)

    setLoading(false)
    if (updateErr) {
      setError("Failed to save: " + updateErr.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  // ── STEP INDICATOR ─────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 text-sm mb-6">
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        step >= 1 ? "bg-[#6366F1] text-white" : "bg-[#334155] text-[#64748B]"
      }`}>1</span>
      <span className={`text-xs ${step >= 1 ? "text-[#94A3B8]" : "text-[#64748B]"}`}>Choose Role</span>
      <span className="text-[#334155] text-xs">──────</span>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        step >= 2 ? "bg-[#6366F1] text-white" : "bg-[#334155] text-[#64748B]"
      }`}>2</span>
      <span className={`text-xs ${step >= 2 ? "text-[#94A3B8]" : "text-[#64748B]"}`}>Your Details</span>
    </div>
  )

  // ── STEP 1: ROLE SELECTION ─────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-6">
        <StepIndicator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Find Work */}
          <button
            type="button"
            onClick={() => toggleRole("find_work")}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
              roles.includes("find_work")
                ? "border-[#6366F1] bg-[#6366F1]/10"
                : "border-[#334155] bg-[#12121A] hover:border-[#6366F1]/40"
            }`}
          >
            {roles.includes("find_work") && (
              <span className="absolute top-3 right-3 w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
            )}
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-white font-bold text-lg mb-1">Find Work</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Freelance, apply to projects &amp; jobs
            </p>
            <div className="mt-4 inline-block bg-[#6366F1]/20 text-[#A5B4FC] text-xs font-bold px-3 py-1 rounded-full border border-[#6366F1]/30">
              ₹49/month
            </div>
          </button>

          {/* Hire Talent */}
          <button
            type="button"
            onClick={() => toggleRole("hire_talent")}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
              roles.includes("hire_talent")
                ? "border-[#F59E0B] bg-[#F59E0B]/10"
                : "border-[#334155] bg-[#12121A] hover:border-[#F59E0B]/40"
            }`}
          >
            {roles.includes("hire_talent") && (
              <span className="absolute top-3 right-3 w-6 h-6 bg-[#F59E0B] rounded-full flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
            )}
            <div className="text-4xl mb-3">👔</div>
            <h3 className="text-white font-bold text-lg mb-1">Hire Talent</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Post jobs, hire freelancers
            </p>
            <div className="mt-4 inline-block bg-[#F59E0B]/20 text-[#FCD34D] text-xs font-bold px-3 py-1 rounded-full border border-[#F59E0B]/30">
              ₹199/month
            </div>
          </button>
        </div>

        <p className="text-center text-[#64748B] text-sm">
          Want both? Select both cards
        </p>

        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={roles.length === 0}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Continue <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    )
  }

  // ── STEP 2: PROFILE DETAILS ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <StepIndicator />

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Back + role chips */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setStep(1); setAccountType(""); setError("") }}
          className="text-[#94A3B8] text-sm hover:text-white transition-colors"
        >
          ← Change role
        </button>
        <div className="flex gap-2">
          {isFindWork && (
            <span className="bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 rounded-full px-3 py-1 text-xs font-medium">
              🔍 Find Work
            </span>
          )}
          {isHireTalent && (
            <span className="bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40 rounded-full px-3 py-1 text-xs font-medium">
              👔 Hire Talent
            </span>
          )}
        </div>
      </div>

      {/* Account type */}
      <div className="space-y-3">
        <Label className="text-[#F8FAFC] font-medium text-base">Are you:</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("individual")}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              accountType === "individual"
                ? "border-[#6366F1] bg-[#6366F1]/10"
                : "border-[#334155] bg-[#12121A] hover:border-[#6366F1]/30"
            }`}
          >
            <div className="text-2xl mb-1">👤</div>
            <p className="text-white font-medium text-sm">Individual</p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("company")}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              accountType === "company"
                ? "border-[#F59E0B] bg-[#F59E0B]/10"
                : "border-[#334155] bg-[#12121A] hover:border-[#F59E0B]/30"
            }`}
          >
            <div className="text-2xl mb-1">🏢</div>
            <p className="text-white font-medium text-sm">Company</p>
          </button>
        </div>
      </div>

      {accountType && (
        <>
          {/* ── Photo upload (find_work only) ─────────────────────────── */}
          {isFindWork && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1E293B] flex items-center justify-center border-2 border-dashed border-[#6366F1]/40">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-[#6366F1]/50" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center cursor-pointer hover:bg-[#4F46E5] transition-colors shadow-lg">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!!uploading}
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "avatars", "avatar")}
                  />
                </label>
              </div>
              <p className="text-xs text-[#94A3B8]">
                {uploading === "avatar"
                  ? "Uploading…"
                  : form.avatar_url
                  ? "✓ Photo added"
                  : "Profile photo (required)"}
              </p>
            </div>
          )}

          {/* ── Company Name ──────────────────────────────────────────── */}
          {isCompany && (
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Company Name *</Label>
              <Input
                value={form.company_name}
                onChange={e => set("company_name", e.target.value)}
                placeholder="Your company name"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11"
              />
            </div>
          )}

          {/* ── Full Name / Contact Person ─────────────────────────────── */}
          <div className="space-y-2">
            <Label className="text-[#F8FAFC] font-medium">
              {isCompany ? "Contact Person Name *" : "Full Name *"}
            </Label>
            <Input
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              placeholder={isCompany ? "Your name" : "Your full name"}
              className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11"
            />
          </div>

          {/* ── Phone + City ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">Phone *</Label>
              <div className="flex">
                <span className="flex items-center px-3 bg-[#334155] border border-r-0 border-[#334155] rounded-l-md text-[#94A3B8] text-sm flex-shrink-0">+91</span>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit number"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11 rounded-l-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">City *</Label>
              <Input
                value={form.location}
                onChange={e => set("location", e.target.value)}
                placeholder="e.g. Mumbai, Delhi"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11"
              />
            </div>
          </div>

          {/* ── Industry + Company Size (company only) ─────────────────── */}
          {isCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#F8FAFC] font-medium">Industry *</Label>
                <Select value={form.industry} onValueChange={v => set("industry", v)}>
                  <SelectTrigger className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] h-11 focus:border-[#6366F1]">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-[#334155]">
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind} className="text-[#F8FAFC] focus:bg-[#334155] focus:text-white">
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#F8FAFC] font-medium">Company Size *</Label>
                <Select value={form.company_size} onValueChange={v => set("company_size", v)}>
                  <SelectTrigger className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] h-11 focus:border-[#6366F1]">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-[#334155]">
                    {COMPANY_SIZES.map(sz => (
                      <SelectItem key={sz} value={sz} className="text-[#F8FAFC] focus:bg-[#334155] focus:text-white">
                        {sz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Website + GST (hire talent company only) ────────────────── */}
          {isHireTalent && isCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#F8FAFC] font-medium">
                  Website <span className="text-[#64748B] font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  value={form.company_website}
                  onChange={e => set("company_website", e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#F8FAFC] font-medium">
                  GST Number <span className="text-[#64748B] font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  value={form.gst_number}
                  onChange={e => set("gst_number", e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11 font-mono"
                />
              </div>
            </div>
          )}

          {/* ── Skills (find_work only) ────────────────────────────────── */}
          {isFindWork && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#F8FAFC] font-medium">
                  Skills * <span className="text-[#94A3B8] font-normal text-xs">(up to 20)</span>
                </Label>
                {form.skills.length > 0 && (
                  <span className="text-[#06B6D4] text-xs font-medium">{form.skills.length} selected</span>
                )}
              </div>

              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map(skill => (
                    <Badge
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 gap-1 cursor-pointer hover:bg-[#06B6D4]/25"
                    >
                      {skill} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 py-1">
                {COMMON_SKILLS.filter(s => !form.skills.includes(s)).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="px-3 py-1.5 rounded-full text-xs border bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#06B6D4]/60 hover:text-[#06B6D4] transition-all"
                  >
                    + {skill}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addCustomSkill()
                    }
                  }}
                  placeholder="Custom skill (press Enter)"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] text-sm"
                />
                <Button
                  type="button"
                  onClick={addCustomSkill}
                  disabled={!skillInput.trim()}
                  className="bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] px-4"
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* ── Bio / About (find_work OR hire_talent company) ─────────── */}
          {(isFindWork || (isHireTalent && isCompany)) && (
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">
                {isCompany ? "About Company *" : "Bio *"}
              </Label>
              <Textarea
                value={form.bio}
                onChange={e => set("bio", e.target.value)}
                placeholder={
                  isCompany
                    ? "Tell freelancers about your company, what you do, and what kind of talent you need…"
                    : "Tell clients about yourself, your experience, and what you're great at…"
                }
                rows={4}
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] resize-none"
              />
              <p className={`text-xs ${form.bio.trim().length >= 30 ? "text-[#4ADE80]" : "text-[#64748B]"}`}>
                {form.bio.trim().length} / 30 min characters
              </p>
            </div>
          )}

          {/* ── What kind of work (hire_talent individual only, optional) ─ */}
          {isHireTalent && isIndividual && (
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">
                What kind of work do you need?{" "}
                <span className="text-[#64748B] font-normal text-xs">(optional)</span>
              </Label>
              <Input
                value={form.work_needs}
                onChange={e => set("work_needs", e.target.value)}
                placeholder="e.g. Need a developer for my startup app"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] h-11"
              />
            </div>
          )}

          {/* ── CV/Resume (find_work only, optional) ──────────────────── */}
          {isFindWork && (
            <div className="space-y-2">
              <Label className="text-[#F8FAFC] font-medium">
                CV / Resume{" "}
                <span className="text-[#64748B] font-normal text-xs">(optional, PDF)</span>
              </Label>
              <div
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                  form.resume_url
                    ? "border-[#4ADE80]/40 bg-[#4ADE80]/5"
                    : "border-[#334155] hover:border-[#6366F1]/40"
                }`}
              >
                {form.resume_url ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-5 w-5 text-[#4ADE80]" />
                    <span className="text-[#4ADE80] text-sm font-medium">CV uploaded ✓</span>
                    <button
                      type="button"
                      onClick={() => set("resume_url", "")}
                      className="text-[#64748B] hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <FileText className="h-8 w-8 text-[#475569] mx-auto mb-2" />
                    <p className="text-[#64748B] text-sm">
                      {uploading === "resume" ? "Uploading…" : "Click to upload PDF"}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      disabled={!!uploading}
                      onChange={e =>
                        e.target.files?.[0] && uploadFile(e.target.files[0], "resumes", "resume")
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !accountType}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2"
      >
        {loading ? "Setting up your profile…" : "Complete Profile →"}
      </button>
    </div>
  )
}
