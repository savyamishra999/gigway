import Link from "next/link"
import { ArrowRight, Briefcase, Building2, CheckCircle2, Link2, MapPin, Sparkles, Wrench } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

const PATHS = [
  { icon: Sparkles,  title: "Freelance", iconBg: "bg-violet-50",      iconColor: "text-violet-600",   steps: ["Services", "Gigs", "Projects"] },
  { icon: Briefcase, title: "Full-time", iconBg: "bg-blue-50",        iconColor: "text-blue-600",     steps: ["Jobs", "Applications", "Career"] },
  { icon: Building2, title: "Hiring",    iconBg: "bg-brand-coral/10", iconColor: "text-brand-coral",  steps: ["Talent", "Jobs", "Projects"] },
]

function MetaRow({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-brand-indigo flex-shrink-0" />
      <p className="text-body-sm text-brand-slate truncate">
        <span className="text-brand-midnight font-medium">{label}</span> · {value}
      </p>
    </div>
  )
}

export default function ProfessionalIdentity() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:sticky lg:top-28">
            <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-3">Professional Identity</p>
            <h2 className="text-h2 font-extrabold text-brand-midnight mb-5">One Profile. Many Possibilities.</h2>
            <p className="text-body-lg text-brand-slate mb-5 max-w-lg">
              Your GigWay identity grows with you. Offer services, explore full-time opportunities,
              hire talent, and build your professional presence — all from one profile.
            </p>
            <p className="text-body-sm text-brand-slate/80 max-w-md">
              No separate accounts. No switching. One identity that adapts to what you&apos;re open to right now.
            </p>
          </div>

          {/* Right: composition */}
          <div>
            {/* Profile card */}
            <div className="animate-float rounded-card bg-white border border-brand-borderLight shadow-elevated p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center text-white text-xl font-bold flex-shrink-0">R</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-brand-midnight text-h3 truncate">Rohan Verma</p>
                    <CheckCircle2 className="h-4 w-4 text-brand-indigo flex-shrink-0" />
                  </div>
                  <p className="text-brand-slate text-body-sm">@rohan.codes</p>
                  <p className="text-brand-slate text-body-sm mt-1.5">Full-stack engineer building products, taking select freelance work.</p>
                  <p className="flex items-center gap-1 text-brand-slate/70 text-caption mt-1.5"><MapPin className="h-3 w-3" /> Bengaluru, India</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <StatusBadge tone="freelance" />
                <StatusBadge tone="fulltime" />
                <StatusBadge tone="hiring" />
              </div>

              <div className="mt-5 pt-5 border-t border-brand-borderLight space-y-2.5">
                <MetaRow icon={Wrench} label="Skills" value="React, Figma, Copywriting +4" />
                <MetaRow icon={Link2} label="Portfolio" value="3 projects" />
                <MetaRow icon={Building2} label="Organizations" value="1 organization" />
              </div>
            </div>

            {/* Connector (desktop/tablet only) */}
            <div className="relative hidden sm:block h-8" aria-hidden="true">
              <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-brand-borderLight" />
              <div className="absolute left-[16.6%] right-[16.6%] top-4 h-px bg-brand-borderLight" />
              <div className="absolute left-[16.6%] top-4 h-4 w-px bg-brand-borderLight" />
              <div className="absolute left-1/2 top-4 h-4 w-px -translate-x-1/2 bg-brand-borderLight" />
              <div className="absolute right-[16.6%] top-4 h-4 w-px bg-brand-borderLight" />
            </div>

            {/* Three paths, one profile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PATHS.map((path, i) => {
                const Icon = path.icon
                const floatClass = i === 0 ? "animate-float" : i === 1 ? "animate-float-delayed" : "animate-float-delayed-2"
                return (
                  <div key={path.title}
                    className={`${floatClass} relative rounded-card bg-brand-ivory border border-brand-borderLight p-5 text-center sm:mt-0 mt-3`}>
                    {/* mobile connector stub */}
                    <div className="sm:hidden absolute -top-3 left-1/2 -translate-x-1/2 h-3 w-px bg-brand-borderLight" aria-hidden="true" />
                    <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${path.iconBg}`}>
                      <Icon className={`h-5 w-5 ${path.iconColor}`} />
                    </div>
                    <p className="font-bold text-brand-midnight text-body-sm mb-2.5">{path.title}</p>
                    <div className="flex items-center justify-center gap-1 flex-wrap text-caption text-brand-slate">
                      {path.steps.map((step, idx) => (
                        <span key={step} className="flex items-center gap-1">
                          {step}
                          {idx < path.steps.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-brand-borderLight" />}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 pt-14 border-t border-brand-borderLight text-center">
          <p className="text-h3 font-bold text-brand-midnight mb-5">Build your professional identity</p>
          <Link href="/login"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-indigo text-white font-bold text-body-lg shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] hover:bg-brand-indigoDark hover:shadow-[0_6px_18px_-4px_rgba(79,70,229,.55)] transition-all">
            Create Your Profile
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
