import { CheckCircle2 } from "lucide-react"

const MODES = [
  { label: "Available for Freelance", className: "text-violet-700 bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  { label: "Open to Full-time Work",  className: "text-blue-700 bg-blue-50 border-blue-200",       dot: "bg-blue-500" },
  { label: "Hiring",                  className: "text-brand-coral bg-brand-coral/10 border-brand-coral/20", dot: "bg-brand-coral" },
]

const POINTS = [
  "One @username identity for everything you do on GigWay",
  "Switch between Freelance, Full-time and Hiring as preferences, not permanent roles",
  "Your skills, portfolio and organizations travel with you across every mode",
]

export default function ProfessionalIdentity() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div>
            <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-3">Professional Identity</p>
            <h2 className="text-h2 font-extrabold text-brand-midnight mb-5">One Profile. Many Possibilities.</h2>
            <p className="text-body-lg text-brand-slate mb-8 max-w-lg">
              Your professional identity evolves with you. You don&apos;t need separate
              accounts for freelancing, full-time work or hiring — one profile adapts to what
              you&apos;re open to right now.
            </p>
            <ul className="space-y-3.5">
              {POINTS.map(point => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-indigo flex-shrink-0 mt-0.5" />
                  <span className="text-brand-midnight text-body">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Profile card mock */}
          <div className="rounded-card bg-brand-ivory border border-brand-borderLight shadow-elevated p-7 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center text-white text-xl font-bold flex-shrink-0">R</div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-brand-midnight text-h3 truncate">Rohan Verma</p>
                  <CheckCircle2 className="h-4 w-4 text-brand-indigo flex-shrink-0" />
                </div>
                <p className="text-brand-slate text-body-sm">@rohan.codes</p>
              </div>
            </div>
            <p className="text-brand-slate text-body mt-4">
              Full-stack engineer. Building products, taking on select freelance projects,
              and occasionally hiring for my studio.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {MODES.map(mode => (
                <span key={mode.label} className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption font-semibold ${mode.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${mode.dot}`} />
                  {mode.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
