import Link from "next/link"
import { ArrowRight, Briefcase, Building2, Search, Sparkles } from "lucide-react"

const PATHS = [
  { icon: Search,     title: "Find Work",             desc: "Browse jobs, projects and gigs matched to your skills.",       href: "/jobs",             cta: "Browse jobs" },
  { icon: Sparkles,   title: "Offer Work",             desc: "List your services and let clients discover you.",             href: "/gigs/new",         cta: "Create a gig" },
  { icon: Briefcase,  title: "Find Talent",            desc: "Search verified professionals ready for your next project.",   href: "/freelancers",      cta: "Discover professionals" },
  { icon: Building2,  title: "Build an Organization",  desc: "Create a company identity, post jobs and grow your team.",     href: "/organizations/new", cta: "Create organization" },
]

export default function WhatYouCanDo() {
  return (
    <section className="bg-brand-ivory py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-14">
          <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-3">What You Can Do</p>
          <h2 className="text-h2 font-extrabold text-brand-midnight">Four paths. One platform.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PATHS.map(path => {
            const Icon = path.icon
            return (
              <Link key={path.title} href={path.href}
                className="group bg-white border border-brand-borderLight rounded-card p-6 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-brand-indigo/10 flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-brand-indigo" />
                </div>
                <h3 className="text-h3 font-bold text-brand-midnight mb-2">{path.title}</h3>
                <p className="text-brand-slate text-body-sm mb-5">{path.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-brand-indigo text-body-sm font-semibold">
                  {path.cta}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
