import Link from "next/link"
import { BriefcaseBusiness, FolderKanban, Package } from "lucide-react"
import { createPublicClient } from "@/lib/supabase/public"
import { withDeadline } from "@/lib/async"

type WorkItem = { id: string; title: string; kind: "Service offered" | "Job posted" | "Project posted"; href: string }

export default async function ProfileWorkPreview({ profileId }: { profileId: string }) {
  try {
    const db = createPublicClient()
    const [gigs, jobs, projects] = await withDeadline(Promise.all([
      db.from("gigs").select("id,title").eq("freelancer_id", profileId).eq("status", "active").order("created_at", { ascending: false }).limit(2),
      db.from("jobs").select("id,title").eq("client_id", profileId).eq("status", "active").order("created_at", { ascending: false }).limit(2),
      db.from("projects").select("id,title").eq("client_id", profileId).eq("status", "open").order("created_at", { ascending: false }).limit(2),
    ]))
    const items: WorkItem[] = [
      ...(gigs.data ?? []).map(item => ({ ...item, kind: "Service offered" as const, href: `/gigs/${item.id}` })),
      ...(jobs.data ?? []).map(item => ({ ...item, kind: "Job posted" as const, href: `/jobs/${item.id}` })),
      ...(projects.data ?? []).map(item => ({ ...item, kind: "Project posted" as const, href: `/projects/${item.id}` })),
    ].slice(0, 4)
    if (!items.length) return null
    const icons = { "Service offered": Package, "Job posted": BriefcaseBusiness, "Project posted": FolderKanban }
    return <section className="mt-7 border-t border-white/8 pt-6" aria-labelledby="profile-work-heading">
      <h2 id="profile-work-heading" className="text-sm font-bold text-white">Offers &amp; opportunities</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{items.map(item => { const Icon = icons[item.kind]; return <Link key={`${item.kind}-${item.id}`} href={item.href} className="flex min-w-0 items-start gap-3 rounded-xl bg-white/[.035] p-3 ring-1 ring-white/8 hover:bg-white/[.06]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#6D5DFB]/15 text-[#B9B3FF]"><Icon className="h-4 w-4" /></span>
        <span className="min-w-0"><span className="block text-xs text-[#929BAE]">{item.kind}</span><span className="block break-words text-sm font-semibold text-white">{item.title}</span></span>
      </Link> })}</div>
    </section>
  } catch { return null }
}
