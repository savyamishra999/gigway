import Link from "next/link"
import { ArrowRight, Package, Search, Users } from "lucide-react"

export default function FindWorkFindTalent() {
  return (
    <section className="py-24 px-4 bg-[#12121A]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-[#F97316] text-sm font-bold uppercase tracking-widest mb-3">Two Sides, One Platform</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Whatever you&apos;re here for</h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">GigWay works the same way for people looking for work and people looking for talent.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Find Work */}
          <div className="bg-[#0A0A0F] border border-[#4F46E5]/20 rounded-2xl p-8 hover:border-[#4F46E5]/50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
              <Search className="h-7 w-7 text-[#818CF8]" />
            </div>
            <h3 className="text-white font-bold text-2xl mb-3">Find Work</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
              Freelance gigs, client projects and full-time jobs — browse real, active listings and apply directly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#818CF8] hover:text-white transition-colors">
                Browse Jobs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-[#334155]">·</span>
              <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#818CF8] hover:text-white transition-colors">
                Browse Projects <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-[#334155]">·</span>
              <Link href="/gigs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#818CF8] hover:text-white transition-colors">
                Browse Gigs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Find Talent */}
          <div className="bg-[#0A0A0F] border border-[#F97316]/20 rounded-2xl p-8 hover:border-[#F97316]/50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-[#FB923C]" />
            </div>
            <h3 className="text-white font-bold text-2xl mb-3">Find Talent</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
              Post a job or project, or browse verified freelancers directly — hire with zero commission on either side.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/freelancers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FB923C] hover:text-white transition-colors">
                Browse Freelancers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-[#334155]">·</span>
              <Link href="/projects/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FB923C] hover:text-white transition-colors">
                Post a Project <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-[#334155]">·</span>
              <Link href="/organizations/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FB923C] hover:text-white transition-colors">
                <Package className="h-3.5 w-3.5" /> Create Organization
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
