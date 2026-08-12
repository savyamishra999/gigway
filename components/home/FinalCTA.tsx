import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function FinalCTA() {
  return (
    <section className="bg-brand-ivory py-20 sm:py-28">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-indigo via-brand-indigo to-brand-coral p-10 sm:p-16 text-center">
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
          <div className="relative z-10">
            <h2 className="text-h1 font-extrabold text-white mb-4">Your next opportunity starts here.</h2>
            <p className="text-body-lg text-white/85 mb-9 max-w-lg mx-auto">
              Build your identity. Find work. Find people. Grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login"
                className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand-indigo font-bold text-body-lg hover:bg-white/90 transition-colors">
                Join GigWay
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/explore"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/40 text-white font-semibold text-body-lg hover:bg-white/10 transition-colors">
                Explore Opportunities
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
