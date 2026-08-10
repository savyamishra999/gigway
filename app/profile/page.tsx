import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Star, CheckCircle2, Edit, ExternalLink,
  Briefcase, IndianRupee, Clock, Link2, FileText,
  Search, Building2,
} from "lucide-react"
import ProfileCompletion from "@/components/profile/ProfileCompletion"
import SkillsList from "@/components/profile/SkillsList"
import { WORK_MODES } from "@/lib/identity"

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

  const [{ data: intents }, { data: memberships }] = await Promise.all([
    supabase.from("profile_intents").select("intent").eq("profile_id", user.id),
    supabase.from("organization_members").select("member_role, organizations(name, username)").eq("profile_id", user.id).eq("status", "active"),
  ])
  const workModes = (intents ?? []).map(x => WORK_MODES.find(mode => mode.value === x.intent)).filter(Boolean)

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
      { label: "Experience years",   done: !!profile?.experience_years },
      { label: "Expected salary",    done: !!profile?.expected_salary },
      { label: "Preferred job type", done: !!(profile?.preferred_job_type && (profile.preferred_job_type as string[]).length > 0) },
      { label: "LinkedIn profile",   done: !!profile?.linkedin_url },
      { label: "CV / Resume",        done: !!profile?.cv_url },
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

  const skills = (profile?.skills as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-6 sm:py-10">
      <div className="container mx-auto px-4 max-w-3xl space-y-3">

        {/* ── Header ── */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-5">

            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-black text-2xl sm:text-3xl flex-shrink-0 overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : initial}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {profile?.full_name || "Your Name"}
                    </h1>
                    {profile?.username && <span className="text-sm font-medium text-[#94A3B8]">@{profile.username}</span>}
                    {isVerified && <CheckCircle2 className="h-5 w-5 text-[#4F46E5] flex-shrink-0" />}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4F46E5]/15 text-[#818CF8] border border-[#4F46E5]/25">
                    {isHireTalent && !rawRoles.includes("find_work")
                      ? <Building2 className="h-3 w-3" />
                      : <Search className="h-3 w-3" />}
                    {roleLabel}
                  </span>
                </div>

                {/* Edit — icon only on mobile, text on sm+ */}
                <Link href="/profile/edit"
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 bg-[#1E1E2E] hover:bg-[#334155] border border-[#334155] text-white text-sm font-semibold rounded-xl transition-colors">
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280] mt-2">
                {profile?.location && (
                  <span className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3.5 w-3.5" /> {profile.location}
                  </span>
                )}
                {isFreelancer && profile?.hourly_rate && (
                  <span className="flex items-center gap-1 text-[#818CF8] font-semibold text-xs">
                    <IndianRupee className="h-3.5 w-3.5" /> {profile.hourly_rate}/hr
                  </span>
                )}
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 text-[#F97316] text-xs">
                    <Star className="h-3.5 w-3.5 fill-current" /> {avgRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {profile?.account_type === "company" && profile?.hire_talent_type === "company" && profile?.company_website && (!memberships || memberships.length === 0) && <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 sm:p-6"><h2 className="text-white font-bold text-sm sm:text-base">You appear to represent a company</h2><p className="text-sm text-[#CBD5E1] mt-1">Website: {profile.company_website}</p><p className="text-xs text-[#94A3B8] mt-2">Confirm a company name and username to create a separate organization identity.</p><Link href="/organizations/new" className="inline-block mt-3 text-sm font-semibold text-[#FCD34D]">Create Company Profile</Link></div>}

        {workModes.length > 0 && <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6"><h2 className="text-white font-bold text-sm sm:text-base mb-3">Work Modes</h2><div className="flex flex-wrap gap-2">{workModes.map(mode => mode && <span key={mode.value} className={`px-3 py-1 rounded-full bg-[#1E1E2E] border border-[#334155] text-xs font-semibold ${mode.color}`}>{mode.label}</span>)}</div></div>}

        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6"><div className="flex items-center justify-between mb-3"><h2 className="text-white font-bold text-sm sm:text-base">My Organizations</h2><Link href="/organizations/new" className="text-xs text-[#818CF8] hover:text-white">Create Organization</Link></div>{memberships && memberships.length > 0 ? <div className="space-y-2">{memberships.map((membership: any) => membership.organizations && <div key={membership.organizations.username} className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">{membership.organizations.name}</p><p className="text-xs text-[#94A3B8]">@{membership.organizations.username}</p></div><div className="text-right"><span className="block text-xs capitalize text-[#94A3B8]">{membership.member_role}</span>{["owner", "admin"].includes(membership.member_role) && <Link href={`/organizations/${membership.organizations.username}/edit`} className="text-xs text-[#818CF8]">Manage</Link>}</div></div>)}</div> : <p className="text-sm text-[#6B7280]">Create an organization to manage a company identity.</p>}</div>

        {/* Completion */}
        <ProfileCompletion pct={completionPct} missing={missingItems} />

        {/* About */}
        {profile?.bio && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6">
            <h2 className="text-white font-bold text-sm sm:text-base mb-2">About</h2>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* ── FREELANCER SECTION ── */}
        {isFreelancer && (
          <>
            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6">
                <h2 className="text-white font-bold text-sm sm:text-base mb-3">
                  Skills
                  <span className="ml-2 text-[#6B7280] text-xs font-normal">({skills.length})</span>
                </h2>
                <SkillsList skills={skills} />
              </div>
            )}

            {/* Job Functions */}
            {profile?.job_function && (Array.isArray(profile.job_function) ? profile.job_function : [profile.job_function]).length > 0 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6">
                <h2 className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
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
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6">
                <h2 className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#818CF8]" /> Portfolio
                </h2>
                <div className="space-y-2">
                  {(profile.portfolio_links as string[]).map(link => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#818CF8] hover:text-white text-sm transition-colors">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate text-xs sm:text-sm">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── JOB SEEKER SECTION ── */}
        {isJobSeeker && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#378ADD]" /> Job Seeker Info
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {profile?.experience_years && (
                <div className="bg-[#1E1E2E] rounded-xl p-3 sm:p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Experience</p>
                  <p className="text-white font-semibold text-sm">{profile.experience_years} yrs</p>
                </div>
              )}
              {profile?.expected_salary && (
                <div className="bg-[#1E1E2E] rounded-xl p-3 sm:p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Expected</p>
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
                      className="px-2.5 py-1 rounded-full bg-[#378ADD]/10 border border-[#378ADD]/25 text-[#93C5FD] text-xs font-medium capitalize">
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
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#F59E0B]" />
              {htType === "company" ? "Company Info" : "Hirer Info"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {profile?.company_name && (
                <div className="bg-[#1E1E2E] rounded-xl p-3 sm:p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Company</p>
                  <p className="text-white font-semibold text-sm truncate">{profile.company_name}</p>
                </div>
              )}
              {profile?.industry && (
                <div className="bg-[#1E1E2E] rounded-xl p-3 sm:p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Industry</p>
                  <p className="text-white font-semibold text-sm truncate">{profile.industry}</p>
                </div>
              )}
              {profile?.company_size && (
                <div className="bg-[#1E1E2E] rounded-xl p-3 sm:p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Size</p>
                  <p className="text-white font-semibold text-sm">{profile.company_size} emp.</p>
                </div>
              )}
              {profile?.company_website && (
                <div className="bg-[#1E1E2E] rounded-xl p-3 sm:p-4">
                  <p className="text-[#6B7280] text-xs mb-1">Website</p>
                  <a href={profile.company_website} target="_blank" rel="noopener noreferrer"
                    className="text-[#F59E0B] text-sm hover:underline truncate block text-xs">{profile.company_website}</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-4 sm:p-6">
            <h2 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F97316]" /> Reviews ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((r: { id: string; rating: number; comment?: string; created_at: string; reviewer: { full_name?: string } | null }) => (
                <div key={r.id} className="border-b border-[#1E1E2E] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] text-sm font-bold flex-shrink-0">
                      {(r.reviewer as { full_name?: string } | null)?.full_name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {(r.reviewer as { full_name?: string } | null)?.full_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-[#F97316] text-[#F97316]" : "text-[#334155]"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[#475569] text-xs flex-shrink-0">
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
