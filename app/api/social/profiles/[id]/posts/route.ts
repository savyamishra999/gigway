import { NextRequest, NextResponse } from "next/server"
import { canViewPost, requireSocialUser, safePost, socialDb } from "@/lib/social/server"

const PAGE_SIZE = 10
const fields = "id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params, viewer = await requireSocialUser(), db = socialDb(), tab = req.nextUrl.searchParams.get("tab") === "reposts" ? "reposts" : "posts"
    if (tab === "posts") {
      const { data, error } = await db.from("posts").select(fields).eq("author_profile_id", id).eq("status", "published").order("created_at", { ascending: false }).limit(PAGE_SIZE + 1)
      if (error) throw error
      const visible: any[] = []; for (const post of data || []) if (await canViewPost(post, viewer?.id)) visible.push(post)
      return NextResponse.json({ items: await Promise.all(visible.slice(0, PAGE_SIZE).map(post => safePost(post, viewer?.id))), nextCursor: visible.length > PAGE_SIZE ? visible[PAGE_SIZE - 1].created_at : null })
    }
    const [repostsRes, sharesRes] = await Promise.all([db.from("post_reposts").select("post_id,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(30), db.from("marketplace_shares").select("id,job_id,project_id,service_id,created_at").eq("actor_user_id", id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30)])
    if (repostsRes.error || sharesRes.error) throw repostsRes.error || sharesRes.error
    const repostRows = repostsRes.data || [], shares = sharesRes.data || []
    const postIds = repostRows.map(row => row.post_id), jobIds = shares.map(row => row.job_id).filter(Boolean), projectIds = shares.map(row => row.project_id).filter(Boolean), serviceIds = shares.map(row => row.service_id).filter(Boolean)
    const [postsRes, jobsRes, projectsRes, servicesRes] = await Promise.all([postIds.length ? db.from("posts").select(fields).in("id", postIds).eq("status", "published") : Promise.resolve({ data: [] as any[] }), jobIds.length ? db.from("jobs").select("id,title,company_name,location,job_type,client_id,status").in("id", jobIds) : Promise.resolve({ data: [] as any[] }), projectIds.length ? db.from("projects").select("id,title,category,budget,client_id,status").in("id", projectIds) : Promise.resolve({ data: [] as any[] }), serviceIds.length ? db.from("gigs").select("id,title,category,price,image_url,owner_id,freelancer_id,status").in("id", serviceIds) : Promise.resolve({ data: [] as any[] })])
    const posts = new Map((postsRes.data || []).map((post: any) => [post.id, post])), jobs = new Map((jobsRes.data || []).map((row: any) => [row.id, row])), projects = new Map((projectsRes.data || []).map((row: any) => [row.id, row])), services = new Map((servicesRes.data || []).map((row: any) => [row.id, row]))
    const social = await Promise.all(repostRows.map(async row => { const post = posts.get(row.post_id); return post && await canViewPost(post, viewer?.id) ? { type: "repost", repostedAt: row.created_at, originalPost: await safePost(post, viewer?.id) } : null }))
    const marketplace = shares.map(share => { const type = share.job_id ? "job" : share.project_id ? "project" : "service", object: any = type === "job" ? jobs.get(share.job_id) : type === "project" ? projects.get(share.project_id) : services.get(share.service_id); if (!object || !["active", "open"].includes(object.status)) return { type: "marketplace_share", shareId: share.id, sharedAt: share.created_at, verb: "reposted", unavailable: true, object: { type, title: "This item is no longer available", href: "#", subtitle: "Unavailable marketplace item", cta: "Unavailable" } }; const own = type === "service" ? object.owner_id === id || object.freelancer_id === id : object.client_id === id; return { type: "marketplace_share", shareId: share.id, sharedAt: share.created_at, verb: own ? "shared" : "reposted", object: { type, title: object.title, href: type === "service" ? `/gigs/${object.id}` : `/${type}s/${object.id}`, subtitle: type === "job" ? [object.company_name, object.location || object.job_type].filter(Boolean).join(" · ") : type === "project" ? [object.category, object.budget ? `₹${Number(object.budget).toLocaleString()}` : null].filter(Boolean).join(" · ") : [object.category, object.price ? `From ₹${Number(object.price).toLocaleString()}` : null].filter(Boolean).join(" · "), image: object.image_url || null, cta: type === "project" ? "View Project" : type === "job" ? "View Job" : "View Service" } } })
    const combined = [...social.filter(Boolean) as any[], ...marketplace].sort((a: any, b: any) => (b.repostedAt || b.sharedAt).localeCompare(a.repostedAt || a.sharedAt) || String(b.shareId || b.originalPost.id).localeCompare(String(a.shareId || a.originalPost.id))).slice(0, PAGE_SIZE)
    return NextResponse.json({ items: combined, nextCursor: null })
  } catch { return NextResponse.json({ error: "feed_unavailable" }, { status: 503 }) }
}
