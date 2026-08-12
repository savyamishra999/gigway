import { Globe2, IndianRupee, Sparkles, Target } from "lucide-react"

const REASONS = [
  { icon: IndianRupee, title: "0% platform commission",       desc: "Keep everything you earn. GigWay never takes a cut." },
  { icon: Sparkles,    title: "One professional identity",     desc: "A single profile that adapts to freelance, full-time or hiring." },
  { icon: Target,      title: "Real opportunities",             desc: "Jobs, projects and gigs that are actually live — no filler." },
  { icon: Globe2,      title: "Global professional network",    desc: "Built to connect talent and opportunity beyond one city or country." },
]

export default function WhyGigway() {
  return (
    <section className="relative overflow-hidden bg-brand-midnight py-20 sm:py-28">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-brand-indigo/20 blur-[110px]" />
        <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-coral/15 blur-[110px]" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <div className="text-center mb-14">
          <p className="text-indigo-300 font-bold text-body-sm uppercase tracking-widest mb-3">Why GigWay</p>
          <h2 className="text-h2 font-extrabold text-white">Built differently, on purpose</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {REASONS.map(reason => {
            const Icon = reason.icon
            return (
              <div key={reason.title} className="bg-white/[.05] border border-white/10 rounded-card p-6">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-indigo-300" />
                </div>
                <h3 className="text-white font-bold text-body mb-2">{reason.title}</h3>
                <p className="text-slate-400 text-body-sm">{reason.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
