import Link from "next/link"
import { AtSign, BadgeCheck, Briefcase, Layers, Sparkles } from "lucide-react"

const OPEN_TO = [
  { label: "Available for Freelance", color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  { label: "Open to Full-time Work",  color: "text-blue-300 bg-blue-400/10 border-blue-400/20" },
]

const SHOWCASE_POINTS = [
  { icon: Sparkles,   title: "Skills & work modes",  desc: "Tell GigWay what you're open to — freelance, full-time, or both — and update it anytime." },
  { icon: Layers,     title: "Gigs & portfolio",     desc: "List the services you offer and let your gigs speak for your work." },
  { icon: Briefcase,  title: "Applications & proposals", desc: "Every job you apply to and every proposal you send lives on your profile." },
]

export default function ProfessionalIdentity() {
  return (
    <section className="py-24 px-4 bg-[#0A0A0F]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-[#818CF8] text-sm font-bold uppercase tracking-widest mb-3">Professional Identity</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            One profile. <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">Your whole career.</span>
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Every GigWay member gets a public profile at their own @username — the one link that shows who you are and what you do.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Mock profile card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#4F46E5]/10 to-[#F97316]/10 blur-2xl pointer-events-none" />
            <div className="relative bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1E1E2E] bg-[#0D0D14]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                <span className="ml-3 text-[#6B7280] text-xs flex items-center gap-1">
                  <AtSign className="h-3 w-3" /> gigway.in/@your.name
                </span>
              </div>
              <div className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-2xl font-black text-white">
                    Y
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-bold text-lg">Your Name</p>
                      <BadgeCheck className="h-4 w-4 text-[#818CF8]" />
                    </div>
                    <p className="text-[#6B7280] text-sm">@your.name</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-5">
                  {OPEN_TO.map(tag => (
                    <span key={tag.label} className={`text-xs px-2.5 py-1 rounded-full border ${tag.color}`}>{tag.label}</span>
                  ))}
                </div>
                <div className="mt-5 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#F97316]" />
                </div>
                <p className="text-[#475569] text-xs mt-2">Profile strength — add skills, portfolio and location to complete yours.</p>
              </div>
            </div>
          </div>

          {/* Showcase points */}
          <div className="space-y-6">
            {SHOWCASE_POINTS.map(point => {
              const Icon = point.icon
              return (
                <div key={point.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#818CF8]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">{point.title}</p>
                    <p className="text-[#6B7280] text-sm leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              )
            })}
            <Link href="/login" className="inline-flex items-center gap-2 text-[#818CF8] hover:text-white font-semibold text-sm transition-colors">
              Claim your username →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
