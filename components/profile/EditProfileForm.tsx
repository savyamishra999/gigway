"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUploader } from "@/components/ui/image-uploader"
import ChipPicker from "@/components/profile/editor/ChipPicker"
import PortfolioEditor from "@/components/profile/editor/PortfolioEditor"
import ResumeCard from "@/components/profile/editor/ResumeCard"
import { Globe, Lock, Building2, ArrowRight, Sparkles } from "lucide-react"
import { resolveRoles } from "@/lib/roles"

interface Profile {
  id: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  tagline?: string | null
  location?: string | null
  phone?: string | null
  phone_is_public?: boolean | null
  is_private?: boolean | null
  verification_status?: string | null
  is_verified?: boolean | null
  // role detection
  user_roles?: string[] | null
  find_work_type?: string | null
  hire_talent_type?: string | null
  account_type?: string | null
  // freelance
  job_function?: string | string[] | null
  skills?: string[] | null
  portfolio_links?: string[] | null
  hourly_rate?: number | null
  availability?: string | null
  // full-time
  experience_years?: number | null
  experience_description?: string | null
  linkedin_url?: string | null
  cv_url?: string | null
  expected_salary?: string | null
  preferred_job_type?: string[] | null
  // hiring (individual — no organization on file)
  company_name?: string | null
  company_size?: string | null
  company_website?: string | null
  industry?: string | null
  gst_number?: string | null
}

type OrgMembership = { name: string; username: string; logoUrl: string | null; role: string }

const JOB_FUNCTIONS = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer",
  "UI/UX Designer", "Graphic Designer", "Brand Designer", "Motion Designer",
  "Content Writer", "Copywriter", "Technical Writer", "Social Media Manager",
  "Digital Marketer", "SEO Specialist", "Performance Marketer", "Email Marketer",
  "Data Analyst", "Data Scientist", "ML Engineer", "AI Engineer",
  "DevOps Engineer", "Cloud Architect", "QA Engineer", "Cybersecurity Analyst",
  "Product Manager", "Project Manager", "Business Analyst", "Scrum Master",
  "Video Editor", "Photographer", "3D Artist", "Animator",
  "Accountant", "Financial Analyst", "Legal Consultant", "HR Consultant",
  "Tutor", "Translator", "Voice Over Artist", "Musician",
]

const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  Development: [
    "React", "Next.js", "Vue.js", "Angular", "TypeScript", "JavaScript", "Node.js",
    "Python", "Django", "FastAPI", "Go", "Rust", "Java", "Spring Boot", "PHP",
    "Laravel", "Ruby on Rails", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "GraphQL", "REST API", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
  ],
  Design: [
    "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign",
    "After Effects", "Premiere Pro", "Blender", "Cinema 4D", "UI Design",
    "UX Research", "Wireframing", "Prototyping", "Brand Identity", "Logo Design",
  ],
  Marketing: [
    "SEO", "Google Ads", "Meta Ads", "Content Marketing", "Email Marketing",
    "Social Media Marketing", "Influencer Marketing", "Affiliate Marketing",
    "Analytics", "Conversion Optimization", "Growth Hacking", "Copywriting",
  ],
  Writing: [
    "Blog Writing", "Technical Writing", "Copywriting", "Content Strategy",
    "Ghostwriting", "Scriptwriting", "Proofreading", "Editing", "Translation",
    "Grant Writing", "Resume Writing", "Academic Writing",
  ],
  Video: [
    "Video Editing", "YouTube Content", "Reels / Shorts", "Motion Graphics",
    "Animation", "2D Animation", "3D Animation", "Color Grading",
    "Subtitling", "Video Production", "Podcast Editing",
  ],
  "AI Tools": [
    "ChatGPT", "Claude AI", "Midjourney", "DALL-E", "Stable Diffusion",
    "AI Copywriting", "AI Image Generation", "Prompt Engineering",
    "AI Automation", "LangChain", "RAG Systems",
  ],
  "Local Services": [
    "Plumbing", "Electrical Work", "Carpentry", "Painting", "Interior Design",
    "Home Cleaning", "Tutoring", "Cooking", "Event Photography",
    "Wedding Photography", "Catering", "Delivery",
  ],
}

const JOB_TYPES = ["full_time", "part_time", "internship", "contract", "remote", "hybrid", "on_site"]
const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education", "E-commerce",
  "Manufacturing", "Real Estate", "Media & Entertainment", "Consulting",
  "Retail", "Logistics", "Agriculture", "Travel & Tourism", "Other",
]
const AVAILABILITY_OPTIONS = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "weekends", label: "Weekends" },
  { value: "not-available", label: "Not Available" },
]

const TABS = ["Profile", "About", "Skills", "Work", "Portfolio", "Preferences", "Organizations"] as const
type Tab = (typeof TABS)[number]

function normalizeJobFunction(value: string | string[] | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-[#F8FAFC] font-bold text-base">{title}</h2>
        {sub && <p className="text-[#64748B] text-xs mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function EditProfileForm({ profile, userId, activeModes = [], organizations = [] }: {
  profile: Profile | null; userId: string; activeModes?: string[]; organizations?: OrgMembership[]
}) {
  const roles = resolveRoles(profile)
  const htType = roles.hireTalentType
  // Union of the modern Work Intents layer and the legacy role fields — so existing
  // freelancer/job-seeker/hiring users keep seeing their section even if they never
  // touch profile_intents, while newly-set intents unlock sections immediately too.
  const freelanceActive = activeModes.includes("offering_services") || roles.isFreelancer
  const fulltimeActive  = activeModes.includes("looking_for_work") || roles.isJobSeeker
  const hiringActive    = activeModes.includes("hiring_talent") || roles.isHireTalent
  const anyWorkActive   = freelanceActive || fulltimeActive || hiringActive
  const hasOrganizations = organizations.length > 0

  const [tab, setTab] = useState<Tab>("Profile")
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    tagline:   profile?.tagline || "",
    bio:       profile?.bio || "",
    location:  profile?.location || "",
    phone:     profile?.phone || "",
    phone_is_public: profile?.phone_is_public !== false,
    is_private:      profile?.is_private === true,
    avatar_url:      profile?.avatar_url || "",
    // stable core
    job_function:    normalizeJobFunction(profile?.job_function),
    skills:          profile?.skills || ([] as string[]),
    portfolio_links: profile?.portfolio_links || ([] as string[]),
    // freelance intent
    hourly_rate:  profile?.hourly_rate?.toString() || "",
    availability: profile?.availability || "",
    // full-time intent
    experience_years:       profile?.experience_years?.toString() || "",
    experience_description: profile?.experience_description || "",
    linkedin_url:            profile?.linkedin_url || "",
    cv_url:                  profile?.cv_url || "",
    expected_salary:         profile?.expected_salary || "",
    preferred_job_type:      profile?.preferred_job_type || ([] as string[]),
    // hiring intent — individual/no-organization fallback only
    company_name:    profile?.company_name || "",
    company_size:    profile?.company_size || "",
    company_website: profile?.company_website || "",
    industry:        profile?.industry || "",
    gst_number:      profile?.gst_number || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const set = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const toggleJobType = (t: string) =>
    setFormData(prev => ({
      ...prev,
      preferred_job_type: prev.preferred_job_type.includes(t)
        ? prev.preferred_job_type.filter(x => x !== t)
        : [...prev.preferred_job_type, t],
    }))

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    return digits.length === 10 || digits.length === 12
  }

  const handleSave = async () => {
    setLoading(true); setError(null); setSuccess(null)

    if (!formData.phone.trim()) { setError("Phone number is required"); setLoading(false); return }
    if (!validatePhone(formData.phone)) { setError("Enter a valid 10-digit Indian phone number"); setLoading(false); return }

    const updatePayload: Record<string, unknown> = {
      full_name:       formData.full_name,
      tagline:         formData.tagline || null,
      bio:             formData.bio || null,
      location:        formData.location || null,
      phone:           formData.phone || null,
      phone_is_public: formData.phone_is_public,
      is_private:      formData.is_private,
      avatar_url:      formData.avatar_url || null,
      // core, always saved regardless of active intent
      job_function:    formData.job_function.length > 0 ? formData.job_function : null,
      skills:          formData.skills,
      portfolio_links: formData.portfolio_links,
    }

    if (freelanceActive) {
      updatePayload.hourly_rate  = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
      updatePayload.availability = formData.availability || null
    }

    if (fulltimeActive) {
      updatePayload.experience_years       = formData.experience_years ? parseInt(formData.experience_years) : null
      updatePayload.experience_description = formData.experience_description || null
      updatePayload.linkedin_url           = formData.linkedin_url || null
      updatePayload.cv_url                 = formData.cv_url || null
      updatePayload.expected_salary        = formData.expected_salary || null
      updatePayload.preferred_job_type     = formData.preferred_job_type.length > 0 ? formData.preferred_job_type : null
    }

    if (hiringActive && !hasOrganizations) {
      updatePayload.company_name    = formData.company_name || null
      updatePayload.company_size    = formData.company_size || null
      updatePayload.company_website = formData.company_website || null
      updatePayload.industry        = formData.industry || null
      updatePayload.gst_number      = formData.gst_number || null
    }

    const { error: saveError } = await supabase.from("profiles").update(updatePayload).eq("id", userId)

    if (saveError) { setError(`Failed to save: ${saveError.message}`); setLoading(false); return }

    setSuccess("Profile saved successfully!")
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 text-sm font-medium">{error}</div>}
      {success && <div className="p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-sm font-medium">{success}</div>}

      {/* Tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? "bg-[#6366F1] text-white" : "bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#334155]"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {tab === "Profile" && (
        <div className="space-y-5">
          <Section title="Photo">
            <ImageUploader kind="avatar" label="Upload photo" value={formData.avatar_url} onChange={url => set("avatar_url", url)} />
          </Section>
          <Section title="Identity">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Full Name *</Label>
                <Input value={formData.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Your full name"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
              </div>
              {profile?.id && (
                <div className="space-y-1">
                  <Label className="text-[#CBD5E1]">Username</Label>
                  <p className="text-[#64748B] text-sm">Your public profile link doesn&apos;t change here — manage it from Work Intents setup.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[#CBD5E1]">Tagline</Label>
                <Input value={formData.tagline} onChange={e => set("tagline", e.target.value)} maxLength={80}
                  placeholder="e.g. Product designer turning ideas into interfaces"
                  className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                <p className="text-[#475569] text-xs">A one-line summary shown right under your name.</p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── About ── */}
      {tab === "About" && (
        <Section title="About you">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">Bio</Label>
              <Textarea value={formData.bio} onChange={e => set("bio", e.target.value)} rows={5}
                placeholder="Tell others about yourself..."
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#CBD5E1]">Location</Label>
              <Input value={formData.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Mumbai, India"
                className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
            </div>
          </div>
        </Section>
      )}

      {/* ── Skills ── */}
      {tab === "Skills" && (
        <div className="space-y-5">
          <Section title="Job Functions" sub={`${formData.job_function.length}/5 selected`}>
            <ChipPicker
              selected={formData.job_function}
              onChange={v => set("job_function", v.slice(0, 5))}
              options={JOB_FUNCTIONS}
              max={5}
              addLabel="Add job function"
              searchPlaceholder="Search job functions..."
              allowCustom
              customPlaceholder="Describe what you do..."
            />
          </Section>
          <Section title="Skills" sub={`${formData.skills.length}/20 selected`}>
            <ChipPicker
              selected={formData.skills}
              onChange={v => set("skills", v.slice(0, 20))}
              options={SKILLS_BY_CATEGORY}
              max={20}
              addLabel="Add skill"
              searchPlaceholder="Search skills..."
              allowCustom
              customPlaceholder="Add a custom skill..."
            />
          </Section>
        </div>
      )}

      {/* ── Work ── */}
      {tab === "Work" && (
        <div className="space-y-5">
          {!anyWorkActive && (
            <div className="bg-[#1E293B] border border-dashed border-[#334155] rounded-2xl p-6 text-center">
              <Sparkles className="h-6 w-6 text-[#6366F1] mx-auto mb-2" />
              <p className="text-[#F8FAFC] font-semibold text-sm">You haven&apos;t set your Work Intents yet</p>
              <p className="text-[#64748B] text-xs mt-1">Choose what you&apos;re open to above to unlock Freelance, Full-time, or Hiring details.</p>
            </div>
          )}

          {freelanceActive && (
            <Section title="Freelance">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#CBD5E1]">Hourly Rate</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                      <Input type="number" value={formData.hourly_rate} onChange={e => set("hourly_rate", e.target.value)} placeholder="e.g. 1500"
                        className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] pl-7" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">/hr</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#CBD5E1]">Availability</Label>
                    <select value={formData.availability} onChange={e => set("availability", e.target.value)}
                      className="w-full h-10 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]">
                      <option value="">Not set</option>
                      {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-[#475569] text-xs">Skills and Portfolio are shared across your whole profile — edit them from their own tabs.</p>
              </div>
            </Section>
          )}

          {fulltimeActive && (
            <Section title="Full-time">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#CBD5E1]">Years of Experience</Label>
                    <Input type="number" min="0" max="50" value={formData.experience_years} onChange={e => set("experience_years", e.target.value)} placeholder="e.g. 3"
                      className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#CBD5E1]">Expected Salary (₹/month)</Label>
                    <Input value={formData.expected_salary} onChange={e => set("expected_salary", e.target.value)} placeholder="e.g. 50000"
                      className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#CBD5E1]">Preferred Job Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => toggleJobType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                          formData.preferred_job_type.includes(t) ? "bg-[#378ADD] text-white border-[#378ADD]" : "bg-transparent text-[#94A3B8] border-[#334155] hover:border-[#378ADD]/50"
                        }`}>
                        {t.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#CBD5E1]">Experience Summary</Label>
                  <Textarea value={formData.experience_description} onChange={e => set("experience_description", e.target.value)} rows={3}
                    placeholder="Briefly describe your work experience..."
                    className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#CBD5E1]">LinkedIn URL</Label>
                  <Input value={formData.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/yourname"
                    className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#CBD5E1]">Resume / CV</Label>
                  <ResumeCard url={formData.cv_url} onChange={url => set("cv_url", url)} userId={userId} />
                </div>
              </div>
            </Section>
          )}

          {hiringActive && (
            <Section title="Hiring">
              {hasOrganizations ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#94A3B8]">You&apos;re hiring through the organization(s) below — manage their jobs, projects and details there.</p>
                  {organizations.map(org => (
                    <div key={org.username} className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-xl p-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {org.logoUrl ? <img src={org.logoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="h-5 w-5 text-[#F59E0B]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[#F8FAFC] text-sm font-semibold truncate">{org.name}</p>
                        <p className="text-[#64748B] text-xs capitalize">@{org.username} · {org.role}</p>
                      </div>
                      {["owner", "admin"].includes(org.role) && (
                        <Link href={`/organizations/${org.username}/edit`} className="flex items-center gap-1 text-xs font-semibold text-[#818CF8] hover:text-white flex-shrink-0">
                          Manage <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                  <Link href="/organizations/new" className="text-xs font-semibold text-[#818CF8] hover:text-white">+ Create another organization</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#94A3B8]">Hiring on your own, without a company page yet? Fill this in — or <Link href="/organizations/new" className="text-[#818CF8] hover:text-white font-semibold">create an organization</Link> instead.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#CBD5E1]">{htType === "company" ? "Company Name" : "Organisation / Name"}</Label>
                      <Input value={formData.company_name} onChange={e => set("company_name", e.target.value)} placeholder="e.g. Acme Pvt Ltd"
                        className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#CBD5E1]">Industry</Label>
                      <select value={formData.industry} onChange={e => set("industry", e.target.value)}
                        className="w-full h-10 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]">
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#CBD5E1]">Company Size</Label>
                      <select value={formData.company_size} onChange={e => set("company_size", e.target.value)}
                        className="w-full h-10 bg-[#0F172A] border border-[#334155] rounded-lg px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]">
                        <option value="">Select size</option>
                        {["1-10", "11-50", "51-200", "201-500", "500+"].map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#CBD5E1]">Website</Label>
                      <Input value={formData.company_website} onChange={e => set("company_website", e.target.value)} placeholder="https://yourcompany.com"
                        className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#CBD5E1]">GST Number <span className="text-[#475569] text-xs">(optional)</span></Label>
                    <Input value={formData.gst_number} onChange={e => set("gst_number", e.target.value.toUpperCase())} maxLength={15}
                      placeholder="22AAAAA0000A1Z5"
                      className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] font-mono" />
                  </div>
                </div>
              )}
            </Section>
          )}
        </div>
      )}

      {/* ── Portfolio ── */}
      {tab === "Portfolio" && (
        <Section title="Portfolio" sub="Link your best work — case studies, live projects, repos.">
          <PortfolioEditor links={formData.portfolio_links} onChange={v => set("portfolio_links", v)} />
        </Section>
      )}

      {/* ── Preferences ── */}
      {tab === "Preferences" && (
        <div className="space-y-5">
          <Section title="Profile Visibility">
            <div className="flex items-center justify-between">
              <p className="text-[#64748B] text-xs max-w-xs">
                {formData.is_private ? "Only companies and admin can view your profile" : "Your profile is visible to everyone"}
              </p>
              <button type="button" onClick={() => set("is_private", !formData.is_private)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  formData.is_private ? "bg-[#334155] border-[#475569] text-[#94A3B8]" : "bg-[#6366F1]/15 border-[#6366F1]/40 text-[#A5B4FC]"
                }`}>
                {formData.is_private ? <><Lock className="h-3.5 w-3.5" /> Private</> : <><Globe className="h-3.5 w-3.5" /> Public</>}
              </button>
            </div>
          </Section>
          <Section title="Phone Number">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm select-none">+91</span>
                  <Input value={formData.phone} onChange={e => set("phone", e.target.value.replace(/[^\d+\s-]/g, ""))} placeholder="9876543210" maxLength={14}
                    className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1] pl-11" />
                </div>
                <button type="button" onClick={() => set("phone_is_public", !formData.phone_is_public)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${
                    formData.phone_is_public ? "bg-[#6366F1]/15 border-[#6366F1]/40 text-[#A5B4FC]" : "bg-[#334155] border-[#475569] text-[#94A3B8]"
                  }`}>
                  {formData.phone_is_public ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
                </button>
              </div>
              <p className="text-[#475569] text-xs">{formData.phone_is_public ? "Visible to everyone" : "Only visible to admin"}</p>
            </div>
          </Section>
        </div>
      )}

      {/* ── Organizations ── */}
      {tab === "Organizations" && (
        <Section title="Organizations" sub="Companies and teams you're part of.">
          {hasOrganizations ? (
            <div className="space-y-2">
              {organizations.map(org => (
                <div key={org.username} className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-xl p-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#6366F1]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {org.logoUrl ? <img src={org.logoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="h-5 w-5 text-[#818CF8]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[#F8FAFC] text-sm font-semibold truncate">{org.name}</p>
                    <p className="text-[#64748B] text-xs capitalize">@{org.username} · {org.role}</p>
                  </div>
                  {["owner", "admin"].includes(org.role) && (
                    <Link href={`/organizations/${org.username}/edit`} className="text-xs font-semibold text-[#818CF8] hover:text-white flex-shrink-0">Manage</Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B]">You&apos;re not part of any organization yet.</p>
          )}
          <Link href="/organizations/new" className="inline-block text-sm font-semibold text-[#818CF8] hover:text-white">+ Create an organization</Link>
        </Section>
      )}

      <div className="flex gap-4 justify-end pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading || !formData.full_name}
          className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold px-8 hover:opacity-90">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
