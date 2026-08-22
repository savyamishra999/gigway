import Link from "next/link"
import { notFound } from "next/navigation"
import { Briefcase, Building2, CheckCircle2, ExternalLink, IndianRupee, Link2, MapPin, MessageSquare, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { WORK_MODES } from "@/lib/identity"
import { intentMeta } from "@/lib/workIntents"
import ProfileConnectionActions from "@/components/connections/ProfileConnectionActions"
import { connectionRow, resolveConnectionState } from "@/lib/connections/server"
import { socialDb } from "@/lib/social/server"

function portfolioTitle(url: string) {
  try {
    const { hostname, pathname } = new URL(url)
    return `${hostname.replace(/^www\./, "")}${pathname !== "/" ? pathname : ""}`.slice(0, 50)
  } catch {
    return url
  }
}

export default async function PublicIdentity({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user: viewer } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,username,avatar_url,bio,location,tagline,skills,job_function,portfolio_links,hourly_rate,is_verified")
    .eq("username", username.toLowerCase())
    .maybeSingle()

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
    const isSelf = viewer?.id === profile.id
    const [connectionState, follow] = viewer && !isSelf ? await Promise.all([
      resolveConnectionState(viewer.id, profile.id),
      socialDb().from("profile_follows").select("followed_profile_id").eq("follower_user_id", viewer.id).eq("followed_profile_id", profile.id).maybeSingle(),
    ]) : ["none" as const, { data: null }]
    const { count: connectionCount } = await socialDb().from("professional_connections").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_user_id.eq.${profile.id},recipient_user_id.eq.${profile.id}`)
    const connection = viewer && !isSelf ? await connectionRow(viewer.id, profile.id) : null

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
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">{profile.full_name || "GigWay member"}</h1>
                    {profile.is_verified && <CheckCircle2 className="h-5 w-5 text-[#A99FFF]" />}
                  </div>
                  <p className="mt-1 text-[#9EA6B8]">@{profile.username}</p>
                  {profile.tagline && <p className="mt-1.5 text-[#D4D8E3] text-sm">{profile.tagline}</p>}
                  {founderLine && <p className="mt-1 text-xs font-medium text-[#B9B3FF]">{founderLine}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#8D96A8]">
                    {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
                    {isFreelancer && profile.hourly_rate && <span className="flex items-center gap-1 text-[#B9B3FF] font-semibold"><IndianRupee className="h-3.5 w-3.5" />{profile.hourly_rate}/hr</span>}
                  </div>
                  <p className="mt-2 text-sm text-[#9EA6B8]">{connectionCount || 0} {connectionCount === 1 ? "Connection" : "Connections"}</p>
                </div>
              </div>
              {!isSelf && viewer && <div className="flex flex-wrap gap-2"><ProfileConnectionActions profileId={profile.id} connectionId={connection?.id} initialState={connectionState} initialFollowing={!!follow.data}/><Link href={`/messages/${profile.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-[#6D5DFB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7d6ffc]"><MessageSquare className="h-4 w-4" /> Message</Link></div>}
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
                  {profile.skills.slice(0, 16).map((skill: string) => (
                    <span key={skill} className="rounded-full bg-[#6D5DFB]/10 px-3 py-1.5 text-xs text-[#B9B3FF]">{skill}</span>
                  ))}
                </div>
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
                <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Building2 className="h-4 w-4 text-[#B9B3FF]" /> Organizations</h2>
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
          </div>
        </section>
      </main>
    )
  }

  const { data: organization } = await supabase.from("organizations").select("*").eq("username", username.toLowerCase()).maybeSingle()
  if (!organization) notFound()
  const { data: members } = await supabase.from("organization_members").select("member_role,profiles(full_name,username,avatar_url)").eq("organization_id", organization.id).eq("status", "active")
  return <main className="min-h-screen bg-[#0A0A0F] pb-24"><div className="h-44 bg-gradient-to-br from-[#302b63] via-[#24243e] to-[#F97316]/40">{organization.cover_url && <img src={organization.cover_url} alt="" className="h-full w-full object-cover" />}</div><section className="mx-auto max-w-4xl px-4"><div className="-mt-12 rounded-3xl bg-[#15151d] p-5 shadow-2xl shadow-black/20 ring-1 ring-white/8 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#242431] text-3xl font-bold text-white ring-4 ring-[#15151d]">{organization.logo_url ? <img src={organization.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="text-[#B9B3FF]" />}</div><div className="flex-1"><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-white">{organization.name}</h1>{organization.is_verified && <CheckCircle2 className="h-5 w-5 text-[#A99FFF]" />}</div><p className="mt-1 text-[#9EA6B8]">@{organization.username}</p>{organization.tagline && <p className="mt-2 text-[#D4D8E3]">{organization.tagline}</p>}</div><div className="flex gap-2">{organization.website && <a href={organization.website} target="_blank" rel="noreferrer" className="rounded-xl bg-[#6D5DFB] px-4 py-2 text-sm font-semibold text-white">Website</a>}<Link href="/jobs" className="rounded-xl bg-white/[.06] px-4 py-2 text-sm font-semibold text-white">Jobs</Link></div></div><div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#9DA6B8]">{organization.industry && <span>{organization.industry}</span>}{organization.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{organization.location}</span>}{organization.company_size && <span>{organization.company_size}</span>}{organization.website && <a href={organization.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#B9B3FF]"><ExternalLink className="h-3.5 w-3.5" />Visit website</a>}</div>{organization.description && <section className="mt-8 border-t border-white/8 pt-6"><h2 className="text-sm font-bold text-white">About {organization.name}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#B8C0D0]">{organization.description}</p></section>}<section className="mt-8 border-t border-white/8 pt-6"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#A99FFF]" /><h2 className="text-sm font-bold text-white">People</h2></div>{members && members.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{members.map((member: any) => member.profiles && <div key={member.profiles.username} className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3"><div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#252535] text-sm font-bold text-white">{member.profiles.avatar_url ? <img src={member.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : member.profiles.full_name?.[0] || "?"}</div><div><p className="text-sm font-semibold text-white">{member.profiles.full_name || "Team member"}</p><p className="text-xs capitalize text-[#929BAE]">{member.member_role}</p></div></div>)}</div> : <p className="mt-3 text-sm text-[#8E97A9]">Team information will appear here.</p>}</section></div></section></main>
}
