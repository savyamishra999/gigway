import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Star, CheckCircle2, Edit, ExternalLink,
  Briefcase, IndianRupee, Clock, Link2, FileText,
  Search, Building2,
} from "lucide-react"
import ProfileCompletion from "@/components/profile/ProfileCompletion"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single()

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name)")
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false })

  const rawRoles     = (profile?.user_roles as string[] | null) ?? []
  const fwType       = profile?.find_work_type as string | null
  const htType       = profile?.hire_talent_type as string | null
  const isFreelancer = rawRoles.includes("find_work") && fwType !== "job_seeker"
  const isJobSeeker  = rawRoles.includes("find_work") && (fwType === "job_seeker" || fwType === "both")
  const isHireTalent = rawRoles.includes("hire_talent")
  const isVerified   = profile?.is_verified === true
  const avgRating    = profile?.avg_rating ?? 0
  const joinDate     = new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const roleLabel = fwType === "both"
    ? "Freelancer + Job Seeker"
    : fwType === "job_seeker" ? "Job Seeker"
    : fwType === "freelancer" ? "Freelancer"
    : htType === "company" ? "Company"
    : htType === "individual" ? "Individual Hirer"
    : "Member"

  const initial = profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"

  // ── Profile completion score ──────────────────────────────────────────────
  const completionItems: { label: string; done: boolean }[] = [
    { label: "Full name",    done: !!profile?.full_name },
    { label: "Profile photo",done: !!profile?.avatar_url },
    { label: "Bio",          done: !!profile?.bio },
    { label: "Location",     done: !!profile?.location },
    { label: "Phone",        done: !!profile?.phone },
  ]
  if (isFreelancer) {
    completionItems.push(
      { label: "Skills",        done: !!(profile?.skills && (profile.skills as string[]).length > 0) },
      { label: "Job function",  done: !!(profile?.job_function && (Array.isArray(profile.job_function) ? profile.job_function : [profile.job_function]).length > 0) },
      { label: "Portfolio link",done: !!(profile?.portfolio_links && (profile.portfolio_links as string[]).length > 0) },
      { label: "Hourly rate",   done: !!profile?.hourly_rate },
    )
  }
  if (isJobSeeker) {
    completionItems.push(
      { label: "Experience years",    done: !!profile?.experience_years },
      { label: "Expected salary",     done: !!profile?.expected_salary },
      { label: "Preferred job type",  done: !!(profile?.preferred_job_type && (profile.preferred_job_type as string[]).length > 0) },
      { label: "LinkedIn profile",    done: !!profile?.linkedin_url },
      { label: "CV / Resume",         done: !!profile?.cv_url },
    )
  }
  if (isHireTalent) {
    completionItems.push(
      { label: "Company name", done: !!profile?.company_name },
      { label: "Industry",     done: !!profile?.industry },
      { label: "Company size", done: !!profile?.company_size },
      { label: "Website",      done: !!profile?.company_website },
    )
  }
  const done  = completionItems.filter(i => i.done).length
  const total = completionItems.length
  const completionPct = Math.round((done / total) * 100)
  const missingItems  = completionItems.filter(i => !i.done).map(i => i.label)

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-3xl space-y-4">

        {/* Header */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-black text-3xl flex-shrink-0 overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white">{profile?.full_name || "Your Name"}</h1>
                {isVerified && <CheckCircle2 className="h-5 w-5 text-[#4F46E5]" />}
              </div>

              {/* Role chip */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4F46E5]/15 text-[#818CF8] border border-[#4F46E5]/25 mb-2">
                {isHireTalent && !rawRoles.includes("find_work")
                  ? <Building2 className="h-3 w-3" />
                  : <Search className="h-3 w-3" />}
                {roleLabel}
              </span>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280] mt-1">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.location}
                  </span>
                )}
                {isFreelancer && profile?.hourly_rate && (
                  <span className="flex items-center gap-1 text-[#818CF8] font-semibold">
                    <IndianRupee className="h-3.5 w-3.5" /> {profile.hourly_rate}/hr
                  </span>
                )}
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 text-[#F97316]">
                    <Star className="h-3.5 w-3.5 fill-current" /> {avgRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <Link href="/profile/edit"
              className="flex items-center gap-2 px-4 py-2 bg-[#1E1E2E] hover:bg-[#334155] border border-[#334155] text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0">
              <Edit className="h-4 w-4" /> Edit Profile
            </Link>
          </div>
        </div>

        {/* Completion */}
        <ProfileCompletion pct={completionPct} missing={missingItems} />

        {/* About */}
        {profile?.bio && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-3">About</h2>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* ── FREELANCER SECTION ── */}
        {isFreelancer && (
          <>
            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-base mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills as string[]).map(skill => (
                    <span key={skill}
                      className="px-3 py-1 rounded-full bg-[#4F46E5]/10 border border-[#4F46E5]/25 text-[#818CF8] text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Functions */}
            {profile?.job_function && (Array.isArray(profile.job_function) ? profile.job_function : [profile.job_function]).length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#818CF8]" /> What I Do
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(profile.job_function) ? profile.job_function : [profile.job_function]).map((fn: string) => (
                    <span key={fn}
                      className="px-3 py-1 rounded-full bg-[#1E1E2E] border border-[#334155] text-[#CBD5E1] text-xs font-medium">
                      {fn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {profile?.portfolio_links && (profile.portfolio_links as string[]).length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
                <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#818CF8]" /> Portfolio
                </h2>
                <div className="space-y-2">
                  {(profile.portfolio_links as string[]).map(link => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#818CF8] hover:text-white text-sm transition-colors">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── JOB SEEKER SECTION ── */}
        {isJobSeeker && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#378ADD]" /> Job Seeker Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile?.experience_years && (
                <div className="bg-[#1E1E2E] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Experience</p>
                  <p className="text-white font-semibold text-sm">{profile.experience_years} years</p>
                </div>
              )}
              {profile?.expected_salary && (
                <div className="bg-[#1E1E2E] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Expected Salary</p>
                  <p className="text-white font-semibold text-sm">₹{Number(profile.expected_salary).toLocaleString("en-IN")}/mo</p>
                </div>
              )}
            </div>

            {profile?.preferred_job_type && (profile.preferred_job_type as string[]).length > 0 && (
              <div>
                <p className="text-[#6B7280] text-xs mb-2">Preferred Job Type</p>
                <div className="flex flex-wrap gap-2">
                  {(profile.preferred_job_type as string[]).map((t: string) => (
                    <span key={t}
                      className="px-3 py-1 rounded-full bg-[#378ADD]/10 border border-[#378ADD]/25 text-[#93C5FD] text-xs font-medium capitalize">
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile?.experience_description && (
              <div>
                <p className="text-[#6B7280] text-xs mb-1">Experience Summary</p>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{profile.experience_description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#378ADD] hover:text-white text-xs transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
              {profile?.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#8B5CF6] hover:text-white text-xs transition-colors">
                  <FileText className="h-3.5 w-3.5" /> View CV / Resume
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── HIRE TALENT SECTION ── */}
        {isHireTalent && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#F59E0B]" />
              {htType === "company" ? "Company Info" : "Hirer Info"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile?.company_name && (
                <div className="bg-[#1E1E2E] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Company</p>
                  <p className="text-white font-semibold text-sm">{profile.company_name}</p>
                </div>
              )}
              {profile?.industry && (
                <div className="bg-[#1E1E2E] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Industry</p>
                  <p className="text-white font-semibold text-sm">{profile.industry}</p>
                </div>
              )}
              {profile?.company_size && (
                <div className="bg-[#1E1E2E] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Company Size</p>
                  <p className="text-white font-semibold text-sm">{profile.company_size} employees</p>
                </div>
              )}
              {profile?.company_website && (
                <div className="bg-[#1E1E2E] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Website</p>
                  <a href={profile.company_website} target="_blank" rel="noopener noreferrer"
                    className="text-[#F59E0B] text-sm hover:underline truncate block">{profile.company_website}</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F97316]" /> Reviews ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((r: { id: string; rating: number; comment?: string; created_at: string; reviewer: { full_name?: string } | null }) => (
                <div key={r.id} className="border-b border-[#1E1E2E] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] text-sm font-bold">
                      {(r.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">
                        {(r.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-[#F97316] text-[#F97316]" : "text-[#334155]"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[#475569] text-xs">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {r.comment && <p className="text-[#6B7280] text-sm pl-11">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[#334155] text-xs pb-4">Member since {joinDate}</p>
      </div>
    </div>
  )
}
