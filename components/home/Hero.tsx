import Link from "next/link"
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react"

interface HeroProps {
  freelancerCount: number
  gigCount: number
  jobCount: number
}

const PILLARS = [
  { icon: Sparkles,    title: "Professional identity",  desc: "A public @username profile that shows what you do." },
  { icon: ShieldCheck, title: "Zero commission",         desc: "Keep 100% of what you earn. Always." },
  { icon: Zap,         title: "Real opportunities",      desc: "Jobs, projects and gigs — no filler, no fakes." },
]

export default function Hero({ freelancerCount, gigCount, jobCount }: HeroProps) {
  const stats = [
    { value: freelancerCount > 0 ? `${freelancerCount}+` : "Growing", label: "Professionals" },
    { value: gigCount > 0 ? `${gigCount}+` : "Active",                label: "Gigs Listed" },
    { value: jobCount > 0 ? `${jobCount}+` : "Live",                  label: "Jobs Posted" },
    { value: "0%",                                                     label: "Commission" },
  ]

  return (
    <section className="relative overflow-hidden mesh-bg min-h-[85vh] sm:min-h-[92vh] flex items-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#4F46E5]/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#F97316]/8 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(79,70,229,1) 1px,transparent 1px),linear-gradient(to right,rgba(79,70,229,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-16 sm:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4F46E5]/30 bg-[#4F46E5]/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#A5B4FC] text-sm font-medium">India&apos;s Zero-Commission Career Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.08] mb-6">
              Your Work.{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] via-[#818CF8] to-[#F97316] bg-clip-text text-transparent">
                Your Network.
              </span>{" "}
              Your Next Opportunity.
            </h1>

            <p className="text-lg text-[#9CA3AF] mb-10 max-w-lg leading-relaxed">
              Build your professional identity, showcase your work, discover opportunities,
              find talent and grow your career — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-lg shadow-lg shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50 hover:scale-[1.02] transition-all"
              >
                Join GigWay
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white font-semibold text-lg backdrop-blur-sm hover:bg-white/5 hover:border-white/30 transition-all"
              >
                Explore Opportunities
              </Link>
            </div>

            {/* Real Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(stat => (
                <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Brand pillars */}
          <div className="hidden lg:flex flex-col gap-5 relative">
            <div className="absolute inset-0 -m-8 rounded-3xl border border-[#4F46E5]/10" />
            {PILLARS.map((p, i) => {
              const Icon = p.icon
              return (
                <div
                  key={p.title}
                  className={`glass-card rounded-2xl p-6 flex items-start gap-4 ${
                    i === 0 ? "animate-float ml-8" : i === 1 ? "animate-float-delayed" : "animate-float-delayed-2 ml-12"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-base mb-1">{p.title}</p>
                    <p className="text-[#9CA3AF] text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              )
            })}
            <div className="glass-card rounded-2xl p-4 text-center ml-4">
              <p className="text-[#9CA3AF] text-xs">🔒 100% Secure Payments · ⚡ Instant Connect · ✅ Verified Members</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
