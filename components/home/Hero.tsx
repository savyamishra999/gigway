"use client"

import Link from "next/link"
import { ArrowRight, Star, CheckCircle } from "lucide-react"
import { useState } from "react"

const STATS = [
  { value: "15,000+", label: "Freelancers" },
  { value: "8,000+", label: "Projects" },
  { value: "0%", label: "Commission" },
  { value: "₹2Cr+", label: "Earned" },
]

const FREELANCER_TABS = [
  { href: "/gigs", label: "Browse Gigs", icon: "💼" },
  { href: "/projects", label: "Find Projects", icon: "🎯" },
  { href: "/jobs", label: "Browse Jobs", icon: "🏢" },
]

const CLIENT_TABS = [
  { href: "/freelancers", label: "Find Freelancers", icon: "👥" },
  { href: "/projects/new", label: "Post a Project", icon: "📋" },
  { href: "/jobs/new", label: "Post a Job", icon: "📝" },
]

const SAMPLE_FREELANCERS = [
  { name: "Rahul K.", skill: "Full Stack Developer", rating: 4.9, rate: "₹1200/hr", verified: true },
  { name: "Priya M.", skill: "UI/UX Designer", rating: 5.0, rate: "₹800/hr", verified: true },
  { name: "Arjun S.", skill: "Content Writer", rating: 4.8, rate: "₹400/hr", verified: false },
]

export default function Hero() {
  const [intent, setIntent] = useState<"work" | "hire">("work")
  const tabs = intent === "work" ? FREELANCER_TABS : CLIENT_TABS

  return (
    <section className="relative overflow-hidden mesh-bg min-h-[95vh] flex items-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#4F46E5]/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#F97316]/8 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#4F46E5]/5 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(79,70,229,1) 1px,transparent 1px),linear-gradient(to right,rgba(79,70,229,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4F46E5]/30 bg-[#4F46E5]/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#A5B4FC] text-sm font-medium">India&apos;s #1 Zero Commission Platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              India&apos;s First{" "}
              <span className="block bg-gradient-to-r from-[#4F46E5] via-[#818CF8] to-[#F97316] bg-clip-text text-transparent">
                Zero Commission
              </span>
              <span className="block">Freelance Platform</span>
            </h1>

            <p className="text-lg text-[#9CA3AF] mb-10 max-w-lg leading-relaxed">
              Find freelance gigs. Browse jobs.{" "}
              <span className="text-white font-semibold">Keep 100% of your earnings.</span>
              <br />
              No hidden fees. No middlemen. Just opportunity.
            </p>

            {/* Intent Toggle */}
            <div className="inline-flex rounded-xl bg-[#12121A] border border-[#1E1E2E] p-1 mb-6">
              <button
                onClick={() => setIntent("work")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  intent === "work"
                    ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/30"
                    : "text-[#6B7280] hover:text-white"
                }`}
              >
                I want to Work
              </button>
              <button
                onClick={() => setIntent("hire")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  intent === "hire"
                    ? "bg-[#F97316] text-white shadow-lg shadow-[#F97316]/30"
                    : "text-[#6B7280] hover:text-white"
                }`}
              >
                I want to Hire
              </button>
            </div>

            {/* CTAs based on intent */}
            <div className="flex flex-col sm:flex-row gap-3 mb-14">
              <Link
                href={tabs[0].href}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-lg shadow-lg shadow-[#4F46E5]/30 hover:shadow-[#4F46E5]/50 hover:scale-105 transition-all"
              >
                {tabs[0].icon} {tabs[0].label}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white font-semibold text-lg backdrop-blur-sm hover:bg-white/5 hover:border-white/30 transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Quick action links */}
            <div className="flex flex-wrap gap-3 mb-10">
              {tabs.slice(1).map(t => (
                <Link key={t.href} href={t.href}
                  className="text-sm text-[#6B7280] hover:text-[#818CF8] transition-colors flex items-center gap-1"
                >
                  {t.icon} {t.label} →
                </Link>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map(stat => (
                <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Floating Freelancer Cards */}
          <div className="hidden lg:flex flex-col gap-5 relative">
            <div className="absolute inset-0 -m-8 rounded-3xl border border-[#4F46E5]/10" />

            {SAMPLE_FREELANCERS.map((f, i) => (
              <div
                key={f.name}
                className={`glass-card rounded-2xl p-5 flex items-center gap-4 cursor-default ${
                  i === 0 ? "animate-float ml-8" : i === 1 ? "animate-float-delayed" : "animate-float-delayed-2 ml-12"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {f.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-white font-semibold text-sm truncate">{f.name}</p>
                    {f.verified && <CheckCircle className="h-3.5 w-3.5 text-[#4F46E5] flex-shrink-0" />}
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
                <div className="flex-shrink-0">
                  <span className="flex items-center gap-1 text-[#10B981] text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Available
                  </span>
                </div>
              </div>
            ))}

            <div className="glass-card rounded-2xl p-4 text-center ml-4">
              <p className="text-[#9CA3AF] text-xs">🔒 100% Secure Payments · ⚡ Instant Connect · 🌟 Verified Clients</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
