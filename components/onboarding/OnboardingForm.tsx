"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  X, Plus, Search, Camera, CheckCircle2, Briefcase, BookOpen,
  Building2, Users, ChevronRight, Package, Upload, FileText,
  IndianRupee,
} from "lucide-react"

// ── constants ─────────────────────────────────────────────────────────────────

const JOB_FUNCTIONS = [
  "Full Stack Developer","Frontend Developer","Backend Developer","Mobile Developer",
  "UI/UX Designer","Graphic Designer","Content Writer","Copywriter","SEO Specialist",
  "Digital Marketer","Social Media Manager","Video Editor","Motion Graphics","Photographer",
  "Data Analyst","Data Scientist","AI/ML Engineer","DevOps Engineer","Cybersecurity",
  "Project Manager","Business Analyst","Sales Professional","HR Professional","Accountant",
  "Legal Consultant","Translator","Voice Over Artist","Music Producer","3D Artist",
  "Architect","Interior Designer","Event Planner","Caterer","Carpenter","Electrician",
  "Plumber","Mechanic","Tutor/Teacher","Fitness Trainer","Chef","Other",
]

const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Development": ["JavaScript","TypeScript","React","Next.js","Vue.js","Node.js","Python","Django","PHP","Laravel","Java","Spring Boot","Go","Flutter","React Native","Swift","Kotlin","PostgreSQL","MySQL","MongoDB","Docker","Kubernetes","AWS","GCP","Azure","GraphQL","REST API","Redis"],
  "Design": ["Figma","Adobe XD","Photoshop","Illustrator","After Effects","Premiere Pro","UI Design","UX Design","Logo Design","Brand Identity","Motion Graphics","3D Modeling","Blender","Canva","Web Design"],
  "Marketing": ["SEO","Google Ads","Facebook Ads","Instagram Marketing","Email Marketing","Content Marketing","Affiliate Marketing","Growth Hacking","Analytics","Copywriting","Brand Strategy"],
  "Writing": ["Content Writing","Blog Writing","Technical Writing","Creative Writing","Ghostwriting","Proofreading","Academic Writing","Script Writing","Translation"],
  "Video": ["Video Editing","YouTube","Short Form Video","Reels/TikTok","Animation","Explainer Videos","Subtitling","Color Grading"],
  "AI Tools": ["ChatGPT","Midjourney","Stable Diffusion","AI Content","Prompt Engineering","AI Automation","n8n","Make.com","Zapier"],
  "Local Services": ["Event Planning","Catering","Photography","Videography","Carpentry","Electrical Work","Plumbing","Interior Design","Tutoring","Fitness Training","Cleaning Services"],
}
const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).flat()

const INDUSTRIES = [
  "Technology","Finance & Banking","Healthcare","Education","E-commerce",
  "Marketing & Advertising","Media & Entertainment","Manufacturing","Real Estate",
  "Consulting","Legal","Hospitality","Logistics","Agriculture","NGO / Non-profit",
  "Government","Retail","Automotive","Telecom","Other",
]

const COMPANY_SIZES = ["1–10","11–50","51–200","201–500","500+"]

const JOB_TYPES = [
  { id: "full_time", label: "Full-time" },
  { id: "part_time", label: "Part-time" },
  { id: "remote",    label: "Remote" },
  { id: "hybrid",    label: "Hybrid" },
  { id: "on_site",   label: "On-site" },
]

// ── types ──────────────────────────────────────────────────────────────────────

type MainRole     = "find_work" | "hire_talent"
type FindWorkType = "freelancer" | "job_seeker"
type HireType     = "individual" | "company"

interface FormData {
  full_name: string; phone: string; avatar_url: string; bio: string; location: string
  // freelancer
  job_function: string[]; skills: string[]; portfolio_links: string[]; hourly_rate: string
  // job seeker
  experience_years: string; experience_description: string; linkedin_url: string
  cv_url: string; expected_salary: string; preferred_job_type: string[]
  // employer
  company_name: string; company_size: string; company_website: string
  industry: string; gst_number: string
}

function initForm(): FormData {
  return {
    full_name:"", phone:"", avatar_url:"", bio:"", location:"",
    job_function:[], skills:[], portfolio_links:[], hourly_rate:"",
    experience_years:"", experience_description:"", linkedin_url:"",
    cv_url:"", expected_salary:"", preferred_job_type:[],
    company_name:"", company_size:"", company_website:"", industry:"", gst_number:"",
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function OnboardingForm({ userId }: { userId: string }) {
  const [step, setStep]                   = useState<1|2|3>(1)
  const [mainRole, setMainRole]           = useState<MainRole|null>(null)
  const [findWorkType, setFindWorkType]   = useState<FindWorkType|null>(null)
  const [hireType, setHireType]           = useState<HireType|null>(null)
  const [formData, setFormData]           = useState<FormData>(initForm())
  const [loading, setLoading]             = useState(false)
  const [uploading, setUploading]         = useState(false)
  const [uploadingCv, setUploadingCv]     = useState(false)
  const [cvFileName, setCvFileName]       = useState("")
  const [error, setError]                 = useState("")
  const [skillInput, setSkillInput]       = useState("")
  const [skillSearch, setSkillSearch]     = useState("")
  const [skillCategory, setSkillCategory] = useState("Development")
  const [linkInput, setLinkInput]         = useState("")
  const [jfSearch, setJfSearch]           = useState("")
  const router = useRouter()
  const supabase = createClient()

  // ── derived ────────────────────────────────────────────────────────────────
  const isFindWork   = mainRole === "find_work"
  const isHireTalent = mainRole === "hire_talent"
  const isFreelancer = isFindWork && findWorkType === "freelancer"
  const isJobSeeker  = isFindWork && findWorkType === "job_seeker"
  const isCompany    = isHireTalent && hireType === "company"

  const canProceed1 =
    mainRole !== null &&
    (!isFindWork   || findWorkType !== null) &&
    (!isHireTalent || hireType    !== null)

  // ── avatar ─────────────────────────────────────────────────────────────────
  const uploadAvatar = async (file: File) => {
    setUploading(true)
    const ext  = file.name.split(".").pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      setFormData(p => ({ ...p, avatar_url: data.publicUrl }))
    }
    setUploading(false)
  }

  // ── CV upload ──────────────────────────────────────────────────────────────
  const uploadCv = async (file: File) => {
    setUploadingCv(true)
    const ext  = file.name.split(".").pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from("cvs").getPublicUrl(path)
      setFormData(p => ({ ...p, cv_url: data.publicUrl }))
      setCvFileName(file.name)
    } else {
      setError("CV upload failed: " + upErr.message)
    }
    setUploadingCv(false)
  }

  // ── skill / job fn helpers ─────────────────────────────────────────────────
  const toggleJF = (fn: string) =>
    setFormData(p => p.job_function.includes(fn)
      ? { ...p, job_function: p.job_function.filter(j => j !== fn) }
      : p.job_function.length >= 5 ? p : { ...p, job_function: [...p.job_function, fn] })

  const toggleSkill = (s: string) =>
    setFormData(p => p.skills.includes(s)
      ? { ...p, skills: p.skills.filter(x => x !== s) }
      : p.skills.length >= 20 ? p : { ...p, skills: [...p.skills, s] })

  const toggleJobType = (id: string) =>
    setFormData(p => p.preferred_job_type.includes(id)
      ? { ...p, preferred_job_type: p.preferred_job_type.filter(t => t !== id) }
      : { ...p, preferred_job_type: [...p.preferred_job_type, id] })

  const addCustomSkill = () => {
    const t = skillInput.trim()
    if (t && !formData.skills.includes(t) && formData.skills.length < 20) {
      setFormData(p => ({ ...p, skills: [...p.skills, t] }))
    }
    setSkillInput("")
  }

  const addLink = () => {
    const t = linkInput.trim()
    if (t && !formData.portfolio_links.includes(t)) {
      setFormData(p => ({ ...p, portfolio_links: [...p.portfolio_links, t] }))
      setLinkInput("")
    }
  }

  const filteredJF     = jfSearch ? JOB_FUNCTIONS.filter(f => f.toLowerCase().includes(jfSearch.toLowerCase())) : JOB_FUNCTIONS
  const filteredSkills = skillSearch
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !formData.skills.includes(s))
    : (SKILLS_BY_CATEGORY[skillCategory] || []).filter(s => !formData.skills.includes(s))

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.full_name.trim()) { setError("Full name is required"); return }
    if (!formData.phone.trim())     { setError("Phone number is required"); return }
    const digits = formData.phone.replace(/\D/g, "")
    if (digits.length < 10)         { setError("Enter a valid 10-digit phone number"); return }
    if (isFreelancer && formData.skills.length === 0) { setError("Select at least 1 skill for freelancer profile"); return }
    if (isCompany && !formData.company_name.trim()) { setError("Company name is required"); return }

    setLoading(true)

    const { error: upErr } = await supabase.from("profiles").update({
      user_roles:              [mainRole],
      find_work_type:          isFindWork   ? findWorkType  : null,
      hire_talent_type:        isHireTalent ? hireType      : null,
      account_type:            isCompany ? "company" : "individual",
      full_name:               formData.full_name.trim(),
      phone:                   formData.phone.trim(),
      avatar_url:              formData.avatar_url || null,
      bio:                     formData.bio || null,
      location:                formData.location || null,
      // freelancer
      job_function:            isFreelancer && formData.job_function.length > 0 ? formData.job_function : null,
      skills:                  isFreelancer ? formData.skills : [],
      portfolio_links:         isFreelancer ? formData.portfolio_links : [],
      hourly_rate:             isFreelancer && formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      // job seeker
      experience_years:        isJobSeeker && formData.experience_years ? parseInt(formData.experience_years) : null,
      experience_description:  isJobSeeker ? (formData.experience_description || null) : null,
      linkedin_url:            isJobSeeker ? (formData.linkedin_url || null) : null,
      cv_url:                  isJobSeeker ? (formData.cv_url || null) : null,
      expected_salary:         isJobSeeker ? (formData.expected_salary || null) : null,
      preferred_job_type:      isJobSeeker && formData.preferred_job_type.length > 0 ? formData.preferred_job_type : null,
      // company/employer
      company_name:            isHireTalent ? (formData.company_name.trim() || null) : null,
      company_size:            isCompany ? (formData.company_size || null) : null,
      company_website:         isHireTalent ? (formData.company_website || null) : null,
      industry:                isHireTalent ? (formData.industry || null) : null,
      gst_number:              isCompany ? (formData.gst_number.trim() || null) : null,
      profile_completed:       true,
    }).eq("id", userId)

    setLoading(false)
    if (upErr) { setError("Failed to save: " + upErr.message); return }
    setStep(3)
    setTimeout(() => router.push("/dashboard"), 1800)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — SUCCESS
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
          <p className="text-[#94A3B8]">Taking you to your dashboard…</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" style={{ animationDelay:`${i*0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — ROLE + SUBTYPE SELECTION
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">What brings you to GigWay?</h2>
          <p className="text-[#94A3B8] text-sm">Choose your primary goal — you can update this anytime</p>
        </div>

        {/* Main role — 2 options */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">I want to…</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id:"find_work",   label:"Find Work",   sub:"Freelance gigs or full-time jobs",  icon:Package,   color:"#6366F1" },
              { id:"hire_talent", label:"Hire Talent", sub:"Post gigs, jobs & projects",         icon:Users,     color:"#F59E0B" },
            ].map(opt => {
              const Icon   = opt.icon
              const active = mainRole === opt.id
              return (
                <button key={opt.id} type="button" onClick={() => {
                  setMainRole(opt.id as MainRole)
                  if (opt.id === "hire_talent") setFindWorkType(null)
                  if (opt.id === "find_work")   setHireType(null)
                }}
                  className="relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer text-left"
                  style={{
                    borderColor:     active ? opt.color : "#1E1E2E",
                    backgroundColor: active ? `${opt.color}15` : "#12121A",
                  }}
                >
                  {active && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor:`${opt.color}20` }}>
                    <Icon className="h-7 w-7" style={{ color: opt.color }} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white text-base">{opt.label}</p>
                    <p className="text-[#94A3B8] text-xs mt-1">{opt.sub}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Find Work subtype — 2 options */}
        {isFindWork && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">I want to find work as a…</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id:"freelancer", label:"Freelancer", sub:"Offer services & get paid per project", icon:Package,  color:"#6366F1" },
                { id:"job_seeker", label:"Job Seeker", sub:"Apply for full-time / part-time roles",  icon:BookOpen, color:"#378ADD" },
              ].map(opt => {
                const Icon   = opt.icon
                const active = findWorkType === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => setFindWorkType(opt.id as FindWorkType)}
                    className="relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor:     active ? opt.color : "#1E1E2E",
                      backgroundColor: active ? `${opt.color}15` : "#12121A",
                    }}
                  >
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor:`${opt.color}20` }}>
                      <Icon className="h-5.5 w-5.5" style={{ color: opt.color }} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white text-sm">{opt.label}</p>
                      <p className="text-[#6B7280] text-xs mt-0.5">{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Hire Talent subtype */}
        {isHireTalent && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">I am hiring as a…</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id:"individual", label:"Individual",  sub:"Hire for personal projects",  icon:Users,     color:"#F59E0B" },
                { id:"company",    label:"Company",     sub:"Scale your team & business",  icon:Building2, color:"#F97316" },
              ].map(opt => {
                const Icon   = opt.icon
                const active = hireType === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => setHireType(opt.id as HireType)}
                    className="relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor:     active ? opt.color : "#1E1E2E",
                      backgroundColor: active ? `${opt.color}15` : "#12121A",
                    }}
                  >
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor:`${opt.color}20` }}>
                      <Icon className="h-5.5 w-5.5" style={{ color: opt.color }} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white text-sm">{opt.label}</p>
                      <p className="text-[#6B7280] text-xs mt-0.5">{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <Button
          onClick={() => setStep(2)}
          disabled={!canProceed1}
          className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white shadow-lg shadow-[#4F46E5]/20 disabled:opacity-40"
        >
          Continue <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — PROFILE FORM
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setStep(1)} className="text-[#6366F1] hover:underline text-xs">
          ← Back
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-[#1E1E2E]">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] w-2/3" />
        </div>
        <span className="text-[#6B7280] text-xs">Step 2 of 2</span>
      </div>

      {/* Role chip */}
      <div className="flex flex-wrap gap-2">
        {isFreelancer && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30">
            <Package className="h-3 w-3" /> Freelancer
          </span>
        )}
        {isJobSeeker && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold bg-[#378ADD]/15 text-[#93C5FD] border border-[#378ADD]/30">
            <BookOpen className="h-3 w-3" /> Job Seeker
          </span>
        )}
        {isHireTalent && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold bg-[#F59E0B]/15 text-[#FCD34D] border border-[#F59E0B]/30">
            {isCompany ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
            {isCompany ? "Company" : "Individual Client"}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* ── COMMON FIELDS ──────────────────────────────────────────────── */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 space-y-5">
        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Basic Info</h3>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#6366F1]/20 flex items-center justify-center">
              {formData.avatar_url
                ? <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-[#A5B4FC]">{formData.full_name?.[0]?.toUpperCase() || "?"}</span>
              }
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center cursor-pointer hover:bg-[#4F46E5] transition-colors">
              <Camera className="h-3.5 w-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
          </div>
          {!formData.avatar_url && (
            <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-center">
              Profiles with photos get 5× more responses
            </p>
          )}
          {uploading && <p className="text-[#6B7280] text-xs">Uploading photo…</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-white font-medium">Full Name *</Label>
          <Input value={formData.full_name}
            onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Your full name" required
            className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#4F46E5] h-11" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white font-medium">Phone *</Label>
            <div className="flex">
              <span className="flex items-center px-3 bg-[#1E1E2E] border border-r-0 border-[#1E1E2E] rounded-l-md text-[#6B7280] text-sm">+91</span>
              <Input type="tel" value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g,"").slice(0,10) }))}
                placeholder="10-digit number"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#4F46E5] h-11 rounded-l-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white font-medium">Location</Label>
            <Input value={formData.location}
              onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Mumbai, India"
              className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#4F46E5] h-11" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white font-medium">Bio <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
          <Textarea value={formData.bio}
            onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
            placeholder="Tell others about yourself — your strengths, goals, what makes you stand out…"
            rows={3}
            className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#4F46E5] resize-none" />
          <p className="text-[#475569] text-xs">{formData.bio.length}/500 characters</p>
        </div>
      </div>

      {/* ── FREELANCER FIELDS ─────────────────────────────────────────── */}
      {isFreelancer && (
        <div className="bg-[#12121A] border border-[#6366F1]/30 rounded-2xl p-5 space-y-6">
          <h3 className="text-xs font-bold text-[#818CF8] uppercase tracking-widest flex items-center gap-2">
            <Package className="h-4 w-4" /> Freelancer Profile
          </h3>

          {/* Hourly rate */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Hourly Rate <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <Input type="number" min="0" value={formData.hourly_rate}
                onChange={e => setFormData(p => ({ ...p, hourly_rate: e.target.value }))}
                placeholder="e.g. 500"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#6366F1] h-11 pl-9" />
            </div>
            <p className="text-[#475569] text-xs">Your rate per hour in INR (₹)</p>
          </div>

          {/* Job Function */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">What do you do? <span className="text-[#6B7280] text-xs font-normal">(up to 5)</span></Label>
              {formData.job_function.length > 0 && <span className="text-[#818CF8] text-xs">{formData.job_function.length}/5 selected</span>}
            </div>
            {formData.job_function.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.job_function.map(fn => (
                  <Badge key={fn} className="bg-[#4F46E5]/20 text-[#A5B4FC] border-[#4F46E5]/40 gap-1">
                    {fn} <button type="button" onClick={() => toggleJF(fn)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <Input value={jfSearch} onChange={e => setJfSearch(e.target.value)} placeholder="Search job functions…"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#4F46E5] h-9 pl-9 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredJF.map(fn => (
                <button key={fn} type="button" onClick={() => toggleJF(fn)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    formData.job_function.includes(fn)
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#4F46E5]/50 hover:text-white"
                  }`}>{fn}</button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">Skills * <span className="text-[#6B7280] text-xs font-normal">(up to 20)</span></Label>
              {formData.skills.length > 0 && <span className="text-[#06B6D4] text-xs">{formData.skills.length} selected</span>}
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(s => (
                  <Badge key={s} className="bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 gap-1">
                    {s} <button type="button" onClick={() => toggleSkill(s)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <Input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search skills…"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#06B6D4] h-9 pl-9 text-sm" />
            </div>
            {!skillSearch && (
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(SKILLS_BY_CATEGORY).map(cat => (
                  <button key={cat} type="button" onClick={() => setSkillCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      skillCategory === cat ? "bg-[#06B6D4] text-white border-[#06B6D4]" : "text-[#6B7280] border-[#1E1E2E] hover:border-[#06B6D4]/50"
                    }`}>{cat}</button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredSkills.map(s => (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className="px-3 py-1.5 rounded-full text-sm border bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#06B6D4]/50 hover:text-[#06B6D4] transition-all">
                  + {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter"||e.key===","){e.preventDefault();addCustomSkill()} }}
                placeholder="Add custom skill (press Enter)"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] text-sm" />
              <Button type="button" onClick={addCustomSkill} disabled={!skillInput.trim()}
                className="bg-[#1E1E2E] hover:bg-[#2D2D3F] text-white border border-[#334155] shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Portfolio Links <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
            {formData.portfolio_links.map(link => (
              <div key={link} className="flex items-center justify-between bg-[#0A0A0F] px-3 py-2 rounded-lg border border-[#1E1E2E]">
                <span className="text-[#A5B4FC] text-sm truncate">{link}</span>
                <button type="button" onClick={() => setFormData(p => ({ ...p, portfolio_links: p.portfolio_links.filter(l => l !== link) }))}
                  className="text-[#6B7280] hover:text-red-400 ml-2 shrink-0"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter"){e.preventDefault();addLink()} }}
                placeholder="https://yourportfolio.com"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569]" />
              <Button type="button" onClick={addLink} disabled={!linkInput.trim()}
                className="bg-[#1E1E2E] hover:bg-[#2D2D3F] text-white border border-[#334155] shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOB SEEKER FIELDS ─────────────────────────────────────────── */}
      {isJobSeeker && (
        <div className="bg-[#12121A] border border-[#378ADD]/30 rounded-2xl p-5 space-y-5">
          <h3 className="text-xs font-bold text-[#378ADD] uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Job Seeker Profile
          </h3>

          {/* CV Upload */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Upload Your CV / Resume</Label>
            {formData.cv_url ? (
              <div className="flex items-center gap-3 bg-[#0A0A0F] border border-[#378ADD]/40 rounded-xl p-3">
                <div className="w-10 h-10 rounded-lg bg-[#378ADD]/15 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-[#378ADD]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{cvFileName || "CV uploaded"}</p>
                  <p className="text-[#4ADE80] text-xs">Successfully uploaded</p>
                </div>
                <button type="button"
                  onClick={() => { setFormData(p => ({ ...p, cv_url: "" })); setCvFileName("") }}
                  className="text-[#6B7280] hover:text-red-400 shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                uploadingCv ? "border-[#378ADD]/30 opacity-60" : "border-[#1E1E2E] hover:border-[#378ADD]/40 hover:bg-[#378ADD]/5"
              }`}>
                <div className="w-12 h-12 rounded-xl bg-[#378ADD]/10 flex items-center justify-center">
                  {uploadingCv ? (
                    <div className="w-5 h-5 border-2 border-[#378ADD] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-[#378ADD]" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">{uploadingCv ? "Uploading…" : "Click to upload CV"}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">PDF, DOC, DOCX — max 10 MB</p>
                </div>
                <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden" disabled={uploadingCv}
                  onChange={e => e.target.files?.[0] && uploadCv(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Preferred Job Type */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Preferred Job Type <span className="text-[#6B7280] font-normal text-xs">(select all that apply)</span></Label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map(t => {
                const active = formData.preferred_job_type.includes(t.id)
                return (
                  <button key={t.id} type="button" onClick={() => toggleJobType(t.id)}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                      active
                        ? "bg-[#378ADD] text-white border-[#378ADD] font-semibold"
                        : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#378ADD]/50 hover:text-white"
                    }`}>{t.label}</button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-medium">Years of Experience</Label>
              <Input type="number" min="0" max="50" value={formData.experience_years}
                onChange={e => setFormData(p => ({ ...p, experience_years: e.target.value }))}
                placeholder="e.g. 3"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#378ADD] h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-white font-medium">Expected Salary <span className="text-[#6B7280] font-normal text-xs">(per year)</span></Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
                <Input value={formData.expected_salary}
                  onChange={e => setFormData(p => ({ ...p, expected_salary: e.target.value }))}
                  placeholder="e.g. 6L – 10L"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#378ADD] h-11 pl-9" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">LinkedIn Profile <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
            <Input value={formData.linkedin_url}
              onChange={e => setFormData(p => ({ ...p, linkedin_url: e.target.value }))}
              placeholder="linkedin.com/in/yourname"
              className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#378ADD] h-11" />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">Work Experience Summary <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
            <Textarea value={formData.experience_description}
              onChange={e => setFormData(p => ({ ...p, experience_description: e.target.value }))}
              placeholder="Describe your past roles, responsibilities, and key achievements…"
              rows={3}
              className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#378ADD] resize-none" />
          </div>
        </div>
      )}

      {/* ── HIRE TALENT FIELDS ─────────────────────────────────────────── */}
      {isHireTalent && (
        <div className={`bg-[#12121A] rounded-2xl p-5 space-y-5 border ${isCompany ? "border-[#F97316]/30" : "border-[#F59E0B]/30"}`}>
          <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isCompany ? "text-[#F97316]" : "text-[#F59E0B]"}`}>
            {isCompany ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {isCompany ? "Company Details" : "Hiring Profile"}
          </h3>

          {isCompany && (
            <div className="space-y-2">
              <Label className="text-white font-medium">Company Name *</Label>
              <Input value={formData.company_name}
                onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))}
                placeholder="Acme Technologies Pvt. Ltd."
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] focus:border-[#F97316] h-11" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-medium">Website <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
              <Input value={formData.company_website}
                onChange={e => setFormData(p => ({ ...p, company_website: e.target.value }))}
                placeholder="https://yourcompany.com"
                className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-white font-medium">Industry</Label>
              <select value={formData.industry}
                onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#F59E0B]">
                <option value="">Select industry…</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>

          {isCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium">Company Size</Label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, company_size: s }))}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        formData.company_size === s
                          ? "bg-[#F97316] text-black border-[#F97316] font-semibold"
                          : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#F97316]/50 hover:text-white"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium">GST Number <span className="text-[#6B7280] font-normal text-xs">(optional)</span></Label>
                <Input value={formData.gst_number}
                  onChange={e => setFormData(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))}
                  placeholder="22AAAAA0000A1Z5"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-white placeholder:text-[#475569] h-11 font-mono" />
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading || !formData.full_name.trim()}
        className="w-full py-6 text-base font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white shadow-lg shadow-[#4F46E5]/20 disabled:opacity-40">
        {loading ? "Setting up your profile…" : "Complete Setup →"}
      </Button>
    </form>
  )
}
