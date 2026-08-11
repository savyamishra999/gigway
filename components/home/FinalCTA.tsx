import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function FinalCTA() {
  return (
    <section className="py-24 px-4 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-[#4F46E5]/10 blur-[100px] pointer-events-none" />
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="bg-gradient-to-br from-[#4F46E5]/15 via-[#12121A] to-[#F97316]/10 border border-[#4F46E5]/20 rounded-3xl p-10 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Your next opportunity is waiting.
          </h2>
          <p className="text-[#9CA3AF] max-w-xl mx-auto mb-10">
            Build your professional identity, discover real work, and grow your career — free to join, zero commission, always.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-lg shadow-lg shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50 hover:scale-[1.02] transition-all">
              Join GigWay
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/explore"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white font-semibold text-lg hover:bg-white/5 hover:border-white/30 transition-all">
              Explore Opportunities
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
