import Link from "next/link"
import { Sparkles, FileText, User, Zap } from "lucide-react"

const TOOLS = [
  {
    icon: FileText,
    title: "Gig Title Writer",
    desc: "Generate click-worthy gig titles that rank higher in search",
    color: "from-[#6366F1] to-[#8B5CF6]",
    border: "border-[#6366F1]/20",
    bg: "bg-[#6366F1]/10",
  },
  {
    icon: Zap,
    title: "Proposal Generator",
    desc: "Write winning project proposals in seconds with AI",
    color: "from-[#F97316] to-[#F59E0B]",
    border: "border-[#F97316]/20",
    bg: "bg-[#F97316]/10",
  },
  {
    icon: User,
    title: "Bio Writer",
    desc: "Craft a professional profile bio that converts visitors to clients",
    color: "from-[#06B6D4] to-[#0EA5E9]",
    border: "border-[#06B6D4]/20",
    bg: "bg-[#06B6D4]/10",
  },
]

export default function AIToolsSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#0A0A0F] via-[#0D0D18] to-[#0A0A0F]">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span className="text-[#A78BFA] text-xs font-bold uppercase tracking-wider">Free AI Tools</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            ✨ Write Better, Win More
          </h2>
          <p className="text-[#94A3B8] text-base max-w-md mx-auto">
            Free AI tools built for Indian freelancers — no signup needed to try.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {TOOLS.map(tool => {
            const Icon = tool.icon
            return (
              <div
                key={tool.title}
                className={`${tool.bg} border ${tool.border} rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{tool.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{tool.desc}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/ai-tools"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white font-black text-base shadow-xl shadow-[#7C3AED]/25 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-4 w-4" />
            Try Free Now →
          </Link>
          <p className="text-[#475569] text-xs mt-3">No account required · Completely free</p>
        </div>
      </div>
    </section>
  )
}
