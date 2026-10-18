import Link from "next/link"
import { ArrowUpRight, FileText, BriefcaseBusiness, FolderOpen } from "lucide-react"
const actions = [
  { href: "/tools/resume-analyzer", title: "Check Resume Score", detail: "Start with a free score", icon: FileText },
  { href: "/gigs/new", title: "Post a Service / Gig", detail: "Turn your skills into work", icon: BriefcaseBusiness },
  { href: "/profile/edit?section=links", title: "Add Portfolio / Project", detail: "Show what you have built", icon: FolderOpen },
]
export default function ProfileNextActions() {
  return <section aria-label="Your next step" className="my-6">
    <div className="grid gap-3 sm:grid-cols-3">{actions.map(({ href, title, detail, icon: Icon }, index) =>
      <Link key={href} href={href} className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-indigo ${index === 0 ? "border-brand-indigo bg-brand-indigo text-white shadow-elevated" : "border-brand-borderLight bg-white text-brand-midnight hover:border-brand-indigo"}`}>
        <div className="flex items-center justify-between"><Icon className="h-6 w-6" /><ArrowUpRight className="h-4 w-4" /></div>
        <h2 className="mt-5 text-lg font-extrabold">{title}</h2><p className={`mt-2 text-sm ${index === 0 ? "text-white/80" : "text-brand-slate"}`}>{detail}</p>
      </Link>)}</div>
    <p className="mt-3 text-sm text-brand-slate">Hiring? <Link href="/create" className="inline-flex min-h-11 items-center font-semibold text-brand-indigo">Post a Job / Project →</Link></p>
  </section>
}