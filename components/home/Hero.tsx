import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-20 px-4">
      {/* Frosted background effect */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              GigWAY
            </span>
            <br />
            India's First Zero Commission Platform
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join 10,000+ freelancers and clients who trust GigWAY for verified projects and 100% earnings
          </p>

          {/* Search Bar - Frosted Glass */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for projects or freelancers..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold px-8 py-6 rounded-full text-lg"
            >
              <Link href="/login">Find Work →</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 px-8 py-6 rounded-full text-lg"
            >
              <Link href="/login?type=post">Post Project →</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {[
              { label: "Active Freelancers", value: "10K+" },
              { label: "Projects Posted", value: "5K+" },
              { label: "Success Rate", value: "98%" },
              { label: "Zero Commission", value: "100%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}