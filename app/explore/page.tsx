import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import DiscoverClient, { type DiscoverData } from "@/components/discover/DiscoverClient"

export const metadata: Metadata = {
  title: "Discover | GigWay",
  description: "Search professionals, companies, jobs, projects and services across GigWay.",
}

type SearchParams = Promise<{ q?: string; tab?: string; skill?: string; location?: string; mode?: string; industry?: string }>
const tabs = ["all", "people", "organizations", "jobs", "projects", "services"]

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = (params.q || "").trim().slice(0, 80)
  const tab = tabs.includes(params.tab || "") ? params.tab! : "all"
  const supabase = await createClient()
  const term = q.replace(/[%_(),]/g, " ")
  const like = `%${term}%`

  let peopleQuery = supabase.from("profiles")
    .select("id, full_name, username, avatar_url, tagline, skills, availability, is_verified, location")
    .eq("profile_completed", true).order("created_at", { ascending: false }).limit(24)
  if (term) peopleQuery = peopleQuery.or(`full_name.ilike.${like},username.ilike.${like},tagline.ilike.${like}`)
  if (params.location) peopleQuery = peopleQuery.ilike("location", `%${params.location}%`)

  let orgsQuery = supabase.from("organizations")
    .select("id, name, username, logo_url, tagline, industry, location, is_verified")
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

  let gigsQuery = supabase.from("gigs").select("id, title, price, delivery_days, category, tags, image_url")
    .eq("status", "active").order("created_at", { ascending: false }).limit(24)
  if (term) gigsQuery = gigsQuery.ilike("title", like)

  const [peopleRes, orgsRes, jobsRes, projectsRes, gigsRes] = await Promise.all([peopleQuery, orgsQuery, jobsQuery, projectsQuery, gigsQuery])
  const data: DiscoverData = {
    people: peopleRes.data || [], organizations: orgsRes.data || [], jobs: jobsRes.data || [],
    projects: projectsRes.data || [], services: gigsRes.data || [],
  }
  return <DiscoverClient initialData={data} query={q} tab={tab} filters={{ skill: params.skill || "", location: params.location || "", mode: params.mode || "", industry: params.industry || "" }} />
}
