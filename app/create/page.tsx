import Link from "next/link"
import { BriefcaseBusiness, FilePlus2, Layers3, PackagePlus } from "lucide-react"

const choices = [
  { href: "/gigs/new", label: "Create a service", description: "Offer a skill people can hire you for.", icon: PackagePlus, color: "text-violet-300 bg-violet-400/10" },
  { href: "/projects/new", label: "Post a project", description: "Get proposals for work you need done.", icon: Layers3, color: "text-orange-300 bg-orange-400/10" },
  { href: "/jobs/new", label: "Post a job", description: "Share a role with the GigWay network.", icon: BriefcaseBusiness, color: "text-sky-300 bg-sky-400/10" },
  { href: "/profile", label: "Showcase your work", description: "Add skills, portfolio links and work modes.", icon: FilePlus2, color: "text-emerald-300 bg-emerald-400/10" },
]

export default function CreatePage() {
  return <main className="min-h-screen bg-[#0A0A0F] px-4 py-10 pb-24"><div className="mx-auto max-w-2xl"><p className="text-sm font-semibold text-[#A99FFF]">CREATE</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Put something great into the world.</h1><p className="mt-2 text-[#9CA3AF]">Choose what you want to create. You&apos;ll continue in the existing GigWay flow.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{choices.map(choice => { const Icon = choice.icon; return <Link key={choice.href} href={choice.href} className="group rounded-2xl bg-white/[.045] p-5 transition hover:-translate-y-0.5 hover:bg-white/[.075] hover:shadow-xl hover:shadow-black/20"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${choice.color}`}><Icon className="h-5 w-5" /></div><h2 className="mt-5 font-semibold text-white group-hover:text-[#C1BBFF]">{choice.label}</h2><p className="mt-1 text-sm leading-relaxed text-[#8C94A6]">{choice.description}</p></Link> })}</div></div></main>
}
