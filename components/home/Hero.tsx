"use client"

import Link from "next/link"
import { ArrowRight, Star, CheckCircle } from "lucide-react"

const STATS = [
  { value: "15,000+", label: "Freelancers" },
  { value: "8,000+", label: "Projects" },
  { value: "0%", label: "Commission" },
  { value: "₹2Cr+", label: "Earned" },
]

const SAMPLE_FREELANCERS = [
  { name: "Priya Sharma", skill: "UI/UX Designer", rating: 4.9, rate: "₹800/hr" },
  { name: "Rahul Verma", skill: "Full Stack Dev", rating: 5.0, rate: "₹1200/hr" },
  { name: "Ananya Singh", skill: "Content Writer", rating: 4.8, rate: "₹400/hr" },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden mesh-bg min-h-[95vh] flex items-center">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#4F46E5]/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#F97316]/8 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#4F46E5]/5 blur-[120px]" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(79,70,229,1) 1px,transparent 1px),linear-gradient(to right,rgba(79,70,229,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4F46E5]/30 bg-[#4F46E5]/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#A5B4FC] text-sm font-medium">India&apos;s #1 Zero Commission Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              Bharat Ka{" "}
              <span className="block">Pehla</span>
              <span className="block bg-gradient-to-r from-[#4F46E5] via-[#818CF8] to-[#F97316] bg-clip-text text-transparent">
                Zero Commission
              </span>
              <span className="block">Platform</span>
            </h1>

            <p className="text-lg text-[#9CA3AF] mb-10 max-w-lg leading-relaxed">
              Freelance gigs lo. Full-time jobs dhundho.{" "}
              <span className="text-white font-semibold">Poori kamaai rakho.</span>
              <br />
              No hidden fees. No middlemen. Just opportunity.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link
                href="/gigs"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-lg shadow-lg shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50 hover:scale-105 transition-all"
              >
                Kaam Dhundho
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white font-semibold text-lg backdrop-blur-sm hover:bg-white/5 hover:border-white/30 transition-all"
              >
                Free Mein Register Karo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map(stat => (
                <div
                  key={stat.label}
                  className="glass-card rounded-2xl p-4 text-center"
                >
                  <p className="text-2xl font-black bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Floating Freelancer Cards */}
          <div className="hidden lg:flex flex-col gap-5 relative">
            {/* Decorative ring */}
            <div className="absolute inset-0 -m-8 rounded-3xl border border-[#4F46E5]/10" />

            {SAMPLE_FREELANCERS.map((f, i) => (
              <div
                key={f.name}
                className={`glass-card rounded-2xl p-5 flex items-center gap-4 cursor-default ${
                  i === 0 ? "animate-float ml-8" : i === 1 ? "animate-float-delayed" : "animate-float-delayed-2 ml-12"
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {f.name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-white font-semibold text-sm truncate">{f.name}</p>
                    <CheckCircle className="h-3.5 w-3.5 text-[#4F46E5] flex-shrink-0" />
                  </div>
                  <p className="text-[#9CA3AF] text-xs truncate">{f.skill}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-[#F97316] text-[#F97316]" />
                      <span className="text-xs text-[#F97316] font-semibold">{f.rating}</span>
                    </div>
                    <span className="text-xs text-[#4F46E5] font-bold">{f.rate}</span>
                  </div>
                </div>

                {/* Available dot */}
                <div className="flex-shrink-0">
                  <span className="flex items-center gap-1 text-[#10B981] text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Available
                  </span>
                </div>
              </div>
            ))}

            {/* Bottom decoration */}
            <div className="glass-card rounded-2xl p-4 text-center ml-4">
              <p className="text-[#9CA3AF] text-xs">🔒 100% Secure Payments · ⚡ Instant Connect · 🌟 Verified Clients</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
