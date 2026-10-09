import Link from "next/link"
import { BriefcaseBusiness, FolderKanban, Package } from "lucide-react"
import { createPublicClient } from "@/lib/supabase/public"
import { withDeadline } from "@/lib/async"

type WorkRow = { id: string; title: string }
export default async function ProfileWorkPreview({ profileId, username, isOwner = false }: { profileId: string; username?: string; isOwner?: boolean }) {
  const db = createPublicClient()
  // Public RLS only. Listings are offers and opportunities, not completed work.
  const requests = [
    db.from("gigs").select("id,title").eq("freelancer_id", profileId).eq("status", "active").order("created_at", { ascending: false }).limit(6),
    db.from("jobs").select("id,title").eq("client_id", profileId).eq("status", "active").order("created_at", { ascending: false }).limit(6),
    db.from("projects").select("id,title").eq("client_id", profileId).eq("status", "open").order("created_at", { ascending: false }).limit(6),
  ]
  const results = await Promise.all(requests.map(async request => {
    try { const result = await withDeadline(Promise.resolve(request)); return { items: (result.data ?? []).slice(0, 6) as WorkRow[], error: !!result.error } }
    catch { return { items: [] as WorkRow[], error: true } }
  }))
  const sections = [
    { title: "Services Offered", path: "gigs", create: "/gigs/new", action: "Offer a Service", Icon: Package },
    { title: "Jobs Posted", path: "jobs", create: "/jobs/new", action: "Post a Job", Icon: BriefcaseBusiness },
    { title: "Projects Posted", path: "projects", create: "/projects/new", action: "Post a Gig Project", Icon: FolderKanban },
  ]
  if (!isOwner && results.every(result => !result.error && !result.items.length)) return <p className="rounded-xl bg-white/[.035] p-4 text-sm text-[#B8C0D0]">No public work yet.</p>
  return <div className="space-y-6">{sections.map(({ title, path, create, action, Icon }, index) => {
    const { items, error } = results[index]
    if (!isOwner && !items.length && !error) return null
    return <section key={path} aria-label={title}>
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {error ? <p role="alert" className="mt-2 text-sm text-[#B8C0D0]">This section could not be loaded. {username && <Link prefetch={false} href={`/u/${encodeURIComponent(username)}?tab=work`} className="underline">Try again</Link>}</p> : items.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{items.map(item => <Link prefetch={false} key={item.id} href={`/${path}/${item.id}`} className="flex min-w-0 items-start gap-3 rounded-xl bg-white/[.035] p-3 ring-1 ring-white/8 hover:bg-white/[.06]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#6D5DFB]/15 text-[#B9B3FF]"><Icon aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 break-words text-sm font-semibold text-white">{item.title}</span>
      </Link>)}</div> : <p className="mt-2 text-sm text-[#B8C0D0]">No active public listings.</p>}
      {isOwner && <Link prefetch={false} href={create} className="mt-3 inline-block rounded-lg px-2 py-3 text-sm font-bold text-[#B9B3FF]">{action}</Link>}
    </section>
  })}</div>
}
