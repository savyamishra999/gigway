"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const STATS = [
  { value: "10K+", label: "Freelancers" },
  { value: "5K+", label: "Projects" },
  { value: "0%", label: "Commission" },
  { value: "₹100Cr+", label: "Earned" },
]

export default function Hero() {
  const [search, setSearch] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/projects?search=${encodeURIComponent(search)}`)
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] min-h-[90vh] flex items-center">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-yellow-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-[#FFD700]/8 rounded-full blur-3xl animate-pulse delay-500" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(to right, #FFD700 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-24 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
            India&apos;s First Zero Commission Platform
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Find Work.{" "}
            <span className="bg-gradient-to-r from-[#FFD700] via-[#FFC200] to-[#FFA500] bg-clip-text text-transparent">
              Keep 100%.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
            Connect with top clients and freelancers across India.
            No middlemen. No hidden fees. Just pure opportunity.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, skills, freelancers..."
              className="w-full pl-12 pr-36 py-4 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700]/50 transition-all text-base"
            />
            <button
              type="submit"
              className="absolute right-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Button
            asChild
            size="lg"
            className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-10 py-6 rounded-full text-lg shadow-lg shadow-[#FFD700]/20"
          >
            <Link href="/freelancers" className="flex items-center gap-2">
              Find Work <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-10 py-6 rounded-full text-lg"
          >
            <Link href="/projects/new">Post a Project</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="text-3xl font-extrabold text-[#FFD700] mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
