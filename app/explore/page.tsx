import Link from "next/link"
import type { Metadata } from "next"
import { Search, Code2, Palette, PenTool, Megaphone, Video, Database, Music, Camera, Globe, Briefcase, BookOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "Explore | GigWay",
  description: "Explore freelance categories on GigWay — India's zero-commission freelance platform.",
}

const CATEGORIES = [
  { name: "Development", icon: Code2, color: "from-[#4F46E5] to-[#6366F1]", gigs: "/gigs?category=development", projects: "/projects?category=web-dev", count: "1,200+" },
  { name: "Design", icon: Palette, color: "from-[#F97316] to-[#FB923C]", gigs: "/gigs?category=design", projects: "/projects?category=design", count: "800+" },
  { name: "Writing", icon: PenTool, color: "from-[#10B981] to-[#34D399]", gigs: "/gigs?category=writing", projects: "/projects?category=writing", count: "600+" },
  { name: "Marketing", icon: Megaphone, color: "from-[#8B5CF6] to-[#A78BFA]", gigs: "/gigs?category=marketing", projects: "/projects?category=marketing", count: "400+" },
  { name: "Video", icon: Video, color: "from-[#EC4899] to-[#F472B6]", gigs: "/gigs?category=video", projects: "/projects?category=video", count: "300+" },
  { name: "Data & AI", icon: Database, color: "from-[#06B6D4] to-[#22D3EE]", gigs: "/gigs?category=other", projects: "/projects?category=data", count: "250+" },
  { name: "Music & Audio", icon: Music, color: "from-[#F59E0B] to-[#FBBF24]", gigs: "/gigs?category=other", projects: "/projects?category=other", count: "150+" },
  { name: "Photography", icon: Camera, color: "from-[#EF4444] to-[#F87171]", gigs: "/gigs?category=other", projects: "/projects?category=other", count: "200+" },
  { name: "Translation", icon: Globe, color: "from-[#4F46E5] to-[#818CF8]", gigs: "/gigs?category=writing", projects: "/projects?category=writing", count: "120+" },
  { name: "Business", icon: Briefcase, color: "from-[#6B7280] to-[#9CA3AF]", gigs: "/gigs?category=other", projects: "/projects?category=other", count: "180+" },
  { name: "Education", icon: BookOpen, color: "from-[#10B981] to-[#6EE7B7]", gigs: "/gigs?category=other", projects: "/projects?category=other", count: "90+" },
  { name: "Other", icon: Search, color: "from-[#374151] to-[#4B5563]", gigs: "/gigs?category=other", projects: "/projects", count: "500+" },
]

const QUICK_LINKS = [
  { label: "Browse All Gigs", href: "/gigs", desc: "Find services from top freelancers" },
  { label: "Browse Projects", href: "/projects", desc: "Find work that matches your skills" },
  { label: "Browse Jobs", href: "/jobs", desc: "Full-time and part-time opportunities" },
  { label: "Top Freelancers", href: "/freelancers", desc: "Work with verified professionals" },
  { label: "Post a Project", href: "/projects/new", desc: "Get proposals from freelancers" },
  { label: "AI Tools", href: "/ai-tools", desc: "Optimize profile & generate proposals" },
]

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[#F97316] text-sm font-bold uppercase tracking-widest mb-2">Explore</p>
          <h1 className="text-4xl font-black text-white mb-3">
            Find Your Next{" "}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">Opportunity</span>
          </h1>
          <p className="text-[#6B7280]">Browse by category or jump to what you need</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          {QUICK_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#4F46E5]/50 transition-colors group"
            >
              <p className="text-white font-semibold text-sm group-hover:text-[#818CF8] transition-colors">{link.label} →</p>
              <p className="text-[#6B7280] text-xs mt-1">{link.desc}</p>
            </Link>
          ))}
        </div>

        {/* Categories */}
        <h2 className="text-white font-black text-2xl mb-5">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <Link key={cat.name} href={cat.gigs}
                className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all group hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-white font-bold mb-1 group-hover:text-[#818CF8] transition-colors">{cat.name}</p>
                <p className="text-[#4B5563] text-xs">{cat.count} gigs</p>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#4F46E5]/10 to-[#F97316]/10 border border-[#4F46E5]/20 rounded-2xl p-8 text-center">
          <h3 className="text-white font-black text-2xl mb-2">Can&apos;t find what you need?</h3>
          <p className="text-[#6B7280] mb-6">Post a project and let freelancers come to you</p>
          <Link href="/projects/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity"
          >
            Post a Project →
          </Link>
        </div>
      </div>
    </div>
  )
}
