import Link from "next/link"
import { ArrowRight, Briefcase, CheckCircle2, MapPin, Star } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative max-w-full overflow-hidden bg-brand-ivory">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-brand-indigo/8 blur-[110px]" />
        <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-brand-coral/8 blur-[110px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 py-14 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill border border-brand-indigo/20 bg-white mb-6 shadow-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
              <span className="text-brand-indigo text-caption font-semibold uppercase tracking-wider">
                The Professional Platform for Work, Talent &amp; Opportunity
              </span>
            </div>

            <h1 className="text-h2 leading-tight sm:text-display font-extrabold text-brand-midnight mb-6">
              Your Professional Identity.<br />
              <span className="text-brand-indigo">Work. Hire. Connect.</span>{" "}
              <span className="text-brand-coral">Grow.</span>
            </h1>

            <p className="text-body-lg text-brand-slate mb-8 max-w-lg">
              Find jobs, get freelance projects, offer your services, hire talent and build your professional network.
            </p>

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mb-9 text-body-sm font-medium text-brand-slate">
              <span>Find Jobs</span>
              <span className="text-brand-borderLight">·</span>
              <span>Freelance Projects</span>
              <span className="text-brand-borderLight">·</span>
              <span>Offer Services · Hire Talent</span>
            </div>

            <p className="mb-5 text-caption font-semibold text-brand-indigo">Free to join · 0% platform commission</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login?mode=join"
                className="group flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-indigo text-white font-bold text-body-lg shadow-elevated hover:bg-brand-indigoDark transition-colors">
                Create Your Professional Identity — Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/work"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-brand-borderLight bg-white text-brand-midnight font-semibold text-body-lg hover:border-brand-indigo/30 hover:bg-brand-indigo/5 transition-colors">
                Explore Work
              </Link>
            </div>
            <p className="mt-5 max-w-lg text-caption text-brand-slate">Share what you know and what you build through GigThoughts, JOX &amp; GLIMPS.</p>
          </div>

          {/* Right: product-led composition — identity + work + opportunity */}
          <div className="hidden lg:block relative h-[440px]">
            {/* Profile identity card */}
            <div className="absolute left-0 top-6 w-72 rounded-card bg-white shadow-elevated border border-brand-borderLight p-5 z-20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center text-white font-bold">A</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-brand-midnight text-body-sm truncate">Aanya Sharma</p>
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo flex-shrink-0" />
                  </div>
                  <p className="text-brand-slate text-caption">@aanya.designs</p>
                </div>
              </div>
              <p className="text-brand-slate text-body-sm mt-3">Product designer turning ideas into interfaces.</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="text-caption font-semibold px-2.5 py-1 rounded-pill text-violet-700 bg-violet-50 border border-violet-200">Freelance</span>
                <span className="text-caption font-semibold px-2.5 py-1 rounded-pill text-blue-700 bg-blue-50 border border-blue-200">Full-time</span>
              </div>
            </div>

            {/* Opportunity card 1 */}
            <div className="absolute right-0 top-0 w-64 rounded-card bg-white shadow-soft border border-brand-borderLight p-4 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-indigo/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-brand-indigo" />
                </div>
                <p className="text-caption font-semibold text-brand-slate uppercase tracking-wide">Job</p>
              </div>
              <p className="font-semibold text-brand-midnight text-body-sm">Senior Product Designer</p>
              <p className="text-brand-slate text-caption mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Remote</p>
            </div>

            {/* Opportunity card 2 */}
            <div className="absolute right-4 bottom-8 w-64 rounded-card bg-white shadow-soft border border-brand-borderLight p-4 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-coral/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-brand-coral" />
                </div>
                <p className="text-caption font-semibold text-brand-slate uppercase tracking-wide">Project</p>
              </div>
              <p className="font-semibold text-brand-midnight text-body-sm">Design system for a fintech app</p>
              <p className="text-brand-slate text-caption mt-1">₹45,000 budget</p>
            </div>

            {/* connective dotted line motif */}
            <svg className="absolute inset-0 w-full h-full z-0" aria-hidden="true">
              <line x1="140" y1="90" x2="300" y2="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 5" />
              <line x1="150" y1="160" x2="290" y2="330" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 5" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
