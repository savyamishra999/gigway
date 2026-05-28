import { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const BASE = "https://gigway.in"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/gigs`,          lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/jobs`,          lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/projects`,      lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/freelancers`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/pricing`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/contact`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  // Freelancer profiles
  const { data: freelancers } = await supabase
    .from("profiles")
    .select("id, updated_at")
    .eq("profile_completed", true)
    .limit(500)

  const freelancerRoutes: MetadataRoute.Sitemap = (freelancers ?? []).map(f => ({
    url: `${BASE}/freelancers/${f.id}`,
    lastModified: f.updated_at ? new Date(f.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  // Active gigs
  const { data: gigs } = await supabase
    .from("gigs")
    .select("id, updated_at")
    .eq("status", "active")
    .limit(500)

  const gigRoutes: MetadataRoute.Sitemap = (gigs ?? []).map(g => ({
    url: `${BASE}/gigs/${g.id}`,
    lastModified: g.updated_at ? new Date(g.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...freelancerRoutes, ...gigRoutes]
}
