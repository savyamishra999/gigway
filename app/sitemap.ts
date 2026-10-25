import type { MetadataRoute } from "next"
import { createPublicClient } from "@/lib/supabase/public"

const BASE = "https://www.gigway.in"
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Always anonymous: a logged-in visitor must not put private rows in the sitemap.
  const db = createPublicClient()
  const routes: MetadataRoute.Sitemap = ["", "/gigs", "/jobs", "/projects", "/freelancers", "/work", "/ai-tools", "/pricing", "/contact", "/privacy", "/terms"].map(path => ({ url: `${BASE}${path || "/"}` }))
  const sources = [
    { table: "profiles", path: "freelancers", field: "profile_completed", value: true, columns: "id,updated_at" },
    { table: "gigs", path: "gigs", field: "status", value: "active", columns: "id" },
    { table: "jobs", path: "jobs", field: "status", value: "active", columns: "id" },
    { table: "projects", path: "projects", field: "status", value: "open", columns: "id,updated_at" },
  ]
  const groups = await Promise.all(sources.map(async source => {
    const entries: MetadataRoute.Sitemap = []
    for (let from = 0; ; from += 500) {
      const { data, error } = await db.from(source.table).select(source.columns).eq(source.field, source.value).order("id").range(from, from + 499)
      if (error) throw new Error(`Sitemap query failed for ${source.table}: ${error.code}`)
      const rows = (data || []) as unknown as { id: string; updated_at?: string | null }[]
      for (const row of rows) {
        const modified = row.updated_at ? new Date(row.updated_at) : null
        entries.push({ url: `${BASE}/${source.path}/${row.id}`, ...(modified && Number.isFinite(modified.getTime()) ? { lastModified: modified } : {}) })
      }
      if (rows.length < 500) break
    }
    return entries
  }))
  return [...routes, ...groups.flat()]
}
