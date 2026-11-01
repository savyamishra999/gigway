import Link from "next/link"
import { ArrowUpRight, BriefcaseBusiness, FolderOpen, MessageSquare, FileText, Sparkles } from "lucide-react"

const createActions = [
  { href: "/gigs/new", title: "Post a Gig / Service", detail: "Turn your skills into work", icon: BriefcaseBusiness },
  { href: "/projects/new", title: "Post a Project", detail: "Find talent for a specific project", icon: FolderOpen },
  { href: "/jobs/new", title: "Post a Job", detail: "Hire for your next role", icon: BriefcaseBusiness },
  { href: "/social/create", title: "Share a GigThought", detail: "Share an update, idea or question", icon: MessageSquare },
]
const toolActions = [
  { href: "/tools/resume-analyzer", title: "Check Resume Score", detail: "Start with a free score", icon: FileText },
  { href: "/tools/pitch", title: "Create Job-Tailored Pitch", detail: "Your first pitch is free", icon: Sparkles },
]
export default function HomeActionRails() {
  return <div className="my-6 space-y-7">
    {[{ title: "Create / Post", href: "/create", actions: createActions }, { title: "Professional Tools", href: "/ai-tools", actions: toolActions }].map(rail =>
      <section key={rail.title} aria-label={rail.title}>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-brand-midnight">{rail.title}</h2><Link href={rail.href} className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm font-bold text-brand-indigo">View all <ArrowUpRight className="h-4 w-4" /></Link></div>
        <div role="region" aria-label={`${rail.title} actions`} tabIndex={0} className={`flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:overflow-visible ${rail.actions.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2"}`}>
          {rail.actions.map(({ href, title, detail, icon: Icon }, index) => <Link key={href} href={href} className={`min-h-44 w-[90%] min-w-0 shrink-0 snap-start rounded-2xl border p-5 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo sm:w-auto sm:shrink ${index === 0 ? "border-brand-indigo bg-brand-indigo text-white shadow-elevated" : "border-brand-borderLight bg-white text-brand-midnight hover:border-brand-indigo"}`}>
            <div className="flex items-center justify-between"><Icon className="h-6 w-6" /><ArrowUpRight className="h-4 w-4" /></div><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className={`mt-2 text-sm ${index === 0 ? "text-white/80" : "text-brand-slate"}`}>{detail}</p>
          </Link>)}
        </div>
      </section>)}
    <Link href="/profile/edit?section=links" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-indigo"><FolderOpen className="h-4 w-4" />Add Portfolio / Project</Link>
  </div>
}
