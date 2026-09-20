import { Suspense } from "react"
import { createPublicClient } from "@/lib/supabase/public"
import { getViewer } from "@/lib/auth/server"
import { withDeadline } from "@/lib/async"
import { SectionUnavailable } from "@/components/layout/SectionStatus"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Briefcase, Building2, CheckCircle2, ExternalLink, IndianRupee, Link2, MapPin, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { WORK_MODES } from "@/lib/identity"
import { intentMeta } from "@/lib/workIntents"
import ProfileConnectionActions from "@/components/connections/ProfileConnectionActions"
import { connectionRow } from "@/lib/connections/server"
import { socialDb } from "@/lib/social/server"
import ProfileSocialFeed from "@/components/social/ProfileSocialFeed"
import PublicWorkplace from "@/components/organizations/PublicWorkplace"
import { WORKPLACE_FIELDS, workplaceSection, workplacePage } from "@/lib/organizations/public"

function portfolioTitle(url: string) {
  try {
    const { hostname, pathname } = new URL(url)
    return `${hostname.replace(/^www\./, "")}${pathname !== "/" ? pathname : ""}`.slice(0, 50)
  } catch {
    return url
  }
}

async function PersonActions({ id, username }: { id: string; username: string }) {
  try {
    const viewer = await getViewer()
    if (!viewer) return null
    if (viewer.id === id) return <Link href="/profile/edit" className="rounded-xl bg-[#6D5DFB] px-4 py-2.5 text-sm font-semibold text-white">Edit Professional Identity</Link>
    const [connection, follow] = await withDeadline(Promise.all([
      connectionRow(viewer.id, id),
      socialDb().from("profile_follows").select("followed_profile_id").eq("follower_user_id", viewer.id).eq("followed_profile_id", id).maybeSingle(),
    ]))
    if (follow.error) throw Error()
    const state = connection?.status === "accepted" ? "connected" : connection?.status === "pending" ? connection.requester_user_id === viewer.id ? "outgoing_pending" : "incoming_pending" : "none"
    return <div className="flex flex-wrap gap-2"><ProfileConnectionActions profileId={id} connectionId={connection?.id} initialState={state} initialFollowing={!!follow.data}/><Link href={`/messages/${id}`} className="flex items-center gap-2 rounded-xl bg-[#6D5DFB] px-4 py-2.5 text-sm font-semibold text-white"><MessageSquare className="h-4 w-4" /> Message</Link></div>
  } catch { return <SectionUnavailable href={`/u/${username}`} label="Account controls could not be loaded." /> }
}
async function PersonCounts({ id, username }: { id: string; username: string }) {
  try {
    const db = socialDb()
    const counts = await withDeadline(Promise.all([
      db.from("professional_connections").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_user_id.eq.${id},recipient_user_id.eq.${id}`),
      db.from("profile_follows").select("followed_profile_id", { count: "exact", head: true }).eq("followed_profile_id", id),
      db.from("profile_follows").select("followed_profile_id", { count: "exact", head: true }).eq("follower_user_id", id),
    ]))
    if (counts.some(result => result.error)) throw Error()
    return <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#9EA6B8]"><Link href={`/u/${username}/followers`}>{counts[1].count || 0} Followers</Link><Link href={`/u/${username}/following`}>{counts[2].count || 0} Following</Link><Link href="/network">{counts[0].count || 0} Connections</Link></div>
  } catch { return <p className="text-sm text-[#9EA6B8]">Counts unavailable.</p> }
}

export default async function PublicIdentity({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ section?: string; page?: string }> }) {
  const { username } = await params
  const supabase = createPublicClient()

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,username,avatar_url,bio,location,tagline,skills,job_function,portfolio_links,hourly_rate,experience_years,experience_description,is_verified")
    .eq("username", username.toLowerCase())
    .maybeSingle()

  if (profileError) throw new Error("This identity could not be loaded. Please try again.")
  // Preserve authenticated-only profile visibility through the original RLS
  // client when the anonymous lookup has no row. No service-role fallback.
  if (!profile) {
    const organization = await supabase.from("organizations").select(WORKPLACE_FIELDS).eq("username", username.toLowerCase()).maybeSingle()
    if (organization.error) throw new Error("This Workplace could not be loaded.")
    if (organization.data) {
      const query = await searchParams
      return <PublicWorkplace organization={organization.data} section={workplaceSection(query.section)} page={workplacePage(query.page)} />
    }
    const viewer = await getViewer()
    if (!viewer) notFound()
    const sessionDb = await createClient()
    const result = await sessionDb.from("profiles").select("id,full_name,username,avatar_url,bio,location,tagline,skills,job_function,portfolio_links,hourly_rate,experience_years,experience_description,is_verified").eq("username", username.toLowerCase()).maybeSingle()
    if (result.error) throw new Error("This identity could not be loaded.")
    profile = result.data
  }

  if (profile) {
    const [{ data: intents }, { data: memberships }] = await Promise.all([
      supabase.from("profile_intents").select("intent_type").eq("profile_id", profile.id).eq("is_active", true),
      supabase.from("organization_members").select("member_role, organizations(name, username, logo_url)").eq("profile_id", profile.id).eq("status", "active"),
    ])
    const modes = (intents ?? []).map(x => WORK_MODES.find(mode => mode.value === x.intent_type)).filter(Boolean)
    const isFreelancer = modes.some(m => m?.value === "offering_services")
    const jobFunctions = profile.job_function ? (Array.isArray(profile.job_function) ? profile.job_function : [profile.job_function]) : []
    const portfolioLinks = (profile.portfolio_links as string[] | null) ?? []
    const primaryOrg = (memberships ?? []).find((m: any) => m.organizations)
    const founderLine = primaryOrg
      ? `${(primaryOrg.member_role as string).charAt(0).toUpperCase()}${(primaryOrg.member_role as string).slice(1)} at ${(primaryOrg.organizations as any).name}`
      : null

    return (
      <main className="min-h-screen bg-[#0A0A0F] pb-24">
        <div className="h-40 bg-gradient-to-br from-[#302b63] via-[#24243e] to-[#F97316]/40" />
        <section className="mx-auto max-w-4xl px-4">
          <div className="-mt-12 rounded-3xl bg-[#15151d] p-5 shadow-2xl shadow-black/20 ring-1 ring-white/8 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#242431] text-3xl font-bold text-white ring-4 ring-[#15151d]">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : profile.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-2xl font-bold text-white">{profile.full_name || "GigWay member"}</h1>
                    {profile.is_verified && <CheckCircle2 className="h-5 w-5 text-[#A99FFF]" />}
                  </div>
                  <p className="mt-1 break-all text-[#9EA6B8]">@{profile.username}</p>
                  {(profile.bio || profile.tagline) && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#D4D8E3]">{profile.bio || profile.tagline}</p>}
                  {founderLine && <p className="mt-1 text-xs font-medium text-[#B9B3FF]">{founderLine}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#8D96A8]">
                    {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
                    {isFreelancer && profile.hourly_rate && <span className="flex items-center gap-1 text-[#B9B3FF] font-semibold"><IndianRupee className="h-3.5 w-3.5" />{profile.hourly_rate}/hr</span>}
                  </div>
                  <Suspense fallback={null}><PersonCounts id={profile.id} username={profile.username} /></Suspense>
                </div>
              </div>
              <Suspense fallback={null}><PersonActions id={profile.id} username={profile.username} /></Suspense>
            </div>

            {modes.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {modes.map(mode => {
                  if (!mode) return null
                  const meta = intentMeta(mode.value)
                  return (
                    <span key={mode.value} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                    </span>
                  )
                })}
              </div>
            )}

            {profile.bio && (
              <div className="mt-7 border-t border-white/8 pt-6">
                <h2 className="text-sm font-bold text-white">About</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#B8C0D0]">{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mt-7">
                <h2 className="text-sm font-bold text-white">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.slice(0, 12).map((skill: string) => (
                    <span key={skill} className="rounded-full bg-[#6D5DFB]/10 px-3 py-1.5 text-xs text-[#B9B3FF]">{skill}</span>
                  ))}
                  {profile.skills.length > 12 && <details className="basis-full"><summary className="mt-2 cursor-pointer text-xs font-bold text-[#B9B3FF]">Show {profile.skills.length - 12} more skills</summary><div className="mt-2 flex flex-wrap gap-2">{profile.skills.slice(12).map((skill: string) => <span key={skill} className="rounded-full bg-[#6D5DFB]/10 px-3 py-1.5 text-xs text-[#B9B3FF]">{skill}</span>)}</div></details>}
                </div>
              </div>
            )}

            {(profile.experience_years || profile.experience_description) && (
              <div className="mt-7">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Briefcase className="h-4 w-4 text-[#B9B3FF]" /> Experience</h2>
                {profile.experience_years ? <p className="mt-2 text-sm font-semibold text-[#D4D8E3]">{profile.experience_years} {profile.experience_years === 1 ? "year" : "years"} of experience</p> : null}
                {profile.experience_description ? <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-[#B8C0D0]">{profile.experience_description}</p> : null}
              </div>
            )}

            {jobFunctions.length > 0 && (
              <div className="mt-7">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Briefcase className="h-4 w-4 text-[#B9B3FF]" /> What I Do</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {jobFunctions.map((fn: string) => (
                    <span key={fn} className="rounded-full bg-white/[.055] px-3 py-1.5 text-xs text-[#CBD5E1]">{fn}</span>
                  ))}
                </div>
              </div>
            )}

            {portfolioLinks.length > 0 && (
              <div className="mt-7">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Link2 className="h-4 w-4 text-[#B9B3FF]" /> Portfolio</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {portfolioLinks.map(link => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-white/[.035] p-3 text-sm text-[#B9B3FF] hover:bg-white/[.06] hover:text-white truncate">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{portfolioTitle(link)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {memberships && memberships.length > 0 && (
              <div className="mt-7 border-t border-white/8 pt-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Building2 className="h-4 w-4 text-[#B9B3FF]" /> Workplaces</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {memberships.map((m: any) => m.organizations && (
                    <Link key={m.organizations.username} href={`/u/${m.organizations.username}`}
                      className="flex items-center gap-3 rounded-xl bg-white/[.035] p-3 hover:bg-white/[.06]">
                      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#252535]">
                        {m.organizations.logo_url ? <img src={m.organizations.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-4 w-4 text-[#B9B3FF]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{m.organizations.name}</p>
                        <p className="text-xs capitalize text-[#929BAE]">{m.member_role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <ProfileSocialFeed profileId={profile.id} name={profile.full_name||"GigWay member"}/>
          </div>
        </section>
      </main>
    )
  }

  notFound()
}
