import { createClient as createServiceClient } from "@supabase/supabase-js"

export interface Ad {
  id: string
  title: string
  subtitle?: string | null
  cta_text: string
  link_url: string
  image_url?: string | null
  accent_color: string
  target_roles: string[]
  position: string
}

// Fetch 1 ad for a position + user roles (server-side only)
export async function fetchAd(
  position: string,
  userRoles: string[] = [],
  findWorkType?: string | null,
  hireTalentType?: string | null,
): Promise<Ad | null> {
  const adminDb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  // Build role keys for matching
  const roleKeys: string[] = []
  if (userRoles.includes("find_work")) {
    if (findWorkType === "job_seeker") roleKeys.push("job_seeker")
    else if (findWorkType === "both")  { roleKeys.push("freelancer"); roleKeys.push("job_seeker") }
    else                               roleKeys.push("freelancer")
  }
  if (userRoles.includes("hire_talent")) {
    if (hireTalentType === "company") roleKeys.push("company")
    else                              roleKeys.push("individual")
  }

  let query = adminDb
    .from("advertisements")
    .select("id, title, subtitle, cta_text, link_url, image_url, accent_color, target_roles, position")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .in("position", [position, "all"])
    .order("priority", { ascending: false })
    .limit(10)

  const { data: ads } = await query

  if (!ads || ads.length === 0) return null

  // Client-side role filter (Supabase array contains is tricky for "empty = all")
  const matching = (ads as Ad[]).filter(ad => {
    if (!ad.target_roles || ad.target_roles.length === 0) return true // show to all
    if (roleKeys.length === 0) return true // logged out user sees all-role ads
    return ad.target_roles.some(r => roleKeys.includes(r))
  })

  if (matching.length === 0) return null
  // Pick random from top matching to add variety
  return matching[Math.floor(Math.random() * Math.min(matching.length, 3))]
}
