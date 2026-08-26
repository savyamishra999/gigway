import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import DiscoverClient, { type DiscoverData } from "@/components/discover/DiscoverClient"
import { scoreOpportunity } from "@/lib/recommendations"
import { scoreIntentAwareOpportunity, scoreNetworkCandidate } from "@/lib/recommendations/intentRanking"

export const metadata: Metadata = {
  title: "Discover | GigWay",
  description: "Search professionals, companies, jobs, projects and services across GigWay.",
}

type SearchParams = Promise<{ q?: string; tab?: string; skill?: string; location?: string; mode?: string; industry?: string }>
const tabs = ["all", "people", "organizations", "jobs", "projects", "services"]
const canonicalIntents = new Set(["looking_for_work", "looking_for_project", "offering_services", "hiring_talent", "grow_network"])
const compareRanked = (a: { finalScore: number; created_at?: string | null; id: string }, b: { finalScore: number; created_at?: string | null; id: string }) => b.finalScore - a.finalScore || (b.created_at || "").localeCompare(a.created_at || "") || a.id.localeCompare(b.id)
function personRelevance(profile: { skills?: string[] | null }, person: { skills?: string[] | null }) { const skills = new Set((profile.skills || []).map(skill => skill.trim().toLowerCase())); const matches = (person.skills || []).filter(skill => skills.has(skill.trim().toLowerCase())); return { baseScore: matches.length * 30, hasRelevantProfileSignal: matches.length > 0 } }

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = (params.q || "").trim().slice(0, 80)
  const tab = tabs.includes(params.tab || "") ? params.tab! : "all"
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const personalizeBrowse = !!user && tab === "all" && !q
  const term = q.replace(/[%_(),]/g, " ")
  const like = `%${term}%`

  let peopleQuery = supabase.from("profiles")
    .select("id, full_name, username, avatar_url, tagline, skills, availability, is_verified, location, created_at")
    .eq("profile_completed", true).order("created_at", { ascending: false }).limit(24)
  if (term) peopleQuery = peopleQuery.or(`full_name.ilike.${like},username.ilike.${like},tagline.ilike.${like}`)
  if (params.location) peopleQuery = peopleQuery.ilike("location", `%${params.location}%`)

  let orgsQuery = supabase.from("organizations")
    .select("id, name, username, logo_url, tagline, industry, location, is_verified, entity_type, created_at")
    .order("created_at", { ascending: false }).limit(24)
  if (term) orgsQuery = orgsQuery.or(`name.ilike.${like},username.ilike.${like},tagline.ilike.${like},industry.ilike.${like}`)
  if (params.industry) orgsQuery = orgsQuery.ilike("industry", `%${params.industry}%`)
  if (params.location) orgsQuery = orgsQuery.ilike("location", `%${params.location}%`)

  let jobsQuery = supabase.from("jobs").select("id, title, company_name, location, job_type, skills_required, created_at")
    .eq("status", "active").order("created_at", { ascending: false }).limit(24)
  if (term) jobsQuery = jobsQuery.or(`title.ilike.${like},company_name.ilike.${like}`)

  let projectsQuery = supabase.from("projects").select("id, title, description, budget, category, skills_required, created_at")
    .eq("status", "open").order("created_at", { ascending: false }).limit(24)
  if (term) projectsQuery = projectsQuery.or(`title.ilike.${like},description.ilike.${like}`)

  let gigsQuery = supabase.from("gigs").select("id, title, price, delivery_days, category, tags, image_url, created_at")
    .eq("status", "active").order("created_at", { ascending: false }).limit(24)
  if (term) gigsQuery = gigsQuery.ilike("title", like)

  const [peopleRes, orgsRes, jobsRes, projectsRes, gigsRes, followsRes, entityFollowsRes, profileRes, intentsRes] = await Promise.all([peopleQuery, orgsQuery, jobsQuery, projectsQuery, gigsQuery, user ? supabase.from("profile_follows").select("followed_profile_id").eq("follower_user_id", user.id) : Promise.resolve({ data: [] }), user ? supabase.from("organization_follows").select("organization_id").eq("follower_user_id", user.id) : Promise.resolve({ data: [] }), personalizeBrowse ? supabase.from("profiles").select("skills,location,job_function").eq("id", user!.id).maybeSingle() : Promise.resolve({ data: null }), personalizeBrowse ? supabase.from("profile_intents").select("intent_type").eq("profile_id", user!.id).eq("is_active", true) : Promise.resolve({ data: [] })])
  const data: DiscoverData = {
    people: peopleRes.data || [], organizations: orgsRes.data || [], jobs: jobsRes.data || [],
    projects: projectsRes.data || [], services: gigsRes.data || [],
  }
  if (personalizeBrowse) {
    const profile = profileRes.data || {}
    const intents = new Set((intentsRes.data || []).map(intent => intent.intent_type).filter(intent => canonicalIntents.has(intent)))
    data.all = [
      ...(peopleRes.data || []).map(item => { const relevance = personRelevance(profile, item); return { id: `person:${item.id}`, item, type: "person" as const, ...scoreNetworkCandidate({ ...relevance, kind: "person", intents }) } }),
      ...(orgsRes.data || []).map(item => { const kind = item.entity_type === "company" ? "company" as const : "organization" as const; return { id: `${kind}:${item.id}`, item, type: "organization" as const, ...scoreNetworkCandidate({ baseScore: 0, hasRelevantProfileSignal: false, kind, intents }) } }),
      ...(jobsRes.data || []).map(item => { const relevance = scoreOpportunity(profile, item); return { id: `job:${item.id}`, item, type: "job" as const, ...scoreIntentAwareOpportunity({ baseScore: relevance.score, kind: "job", intents }) } }),
      ...(projectsRes.data || []).map(item => { const relevance = scoreOpportunity(profile, item); return { id: `project:${item.id}`, item, type: "project" as const, ...scoreIntentAwareOpportunity({ baseScore: relevance.score, kind: "project", intents }) } }),
      ...(gigsRes.data || []).map(item => { const relevance = scoreOpportunity(profile, { ...item, skills_required: item.tags, location: null }); return { id: `service:${item.id}`, item, type: "service" as const, ...scoreIntentAwareOpportunity({ baseScore: relevance.score, kind: "service", intents }) } }),
    ].sort((a, b) => compareRanked({ ...a, created_at: a.item.created_at }, { ...b, created_at: b.item.created_at })).slice(0, 18)
  }
  return <DiscoverClient initialData={data} query={q} tab={tab} filters={{ skill: params.skill || "", location: params.location || "", mode: params.mode || "", industry: params.industry || "" }} followedProfileIds={(followsRes.data || []).map(item => item.followed_profile_id)} followedOrganizationIds={(entityFollowsRes.data || []).map(item => item.organization_id)} />
}
