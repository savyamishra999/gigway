"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import FreelancerCard from "@/components/freelancers/FreelancerCard"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Freelancer {
  id: string
  full_name: string | null
  avatar_url: string | null
  tagline: string | null
  bio: string | null
  hourly_rate: number | null
  skills: string[] | null
  is_verified: boolean | null
  avg_rating: number | null
  availability: string | null
}

const SKILL_FILTERS = ["React", "Next.js", "TypeScript", "Node.js", "Python", "Figma", "UI/UX", "WordPress"]

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [search, setSearch] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [maxRate, setMaxRate] = useState("")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchFreelancers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("profiles")
      .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, avg_rating, availability")
      .in("user_type", ["freelancer", "both"])
      .order("avg_rating", { ascending: false })

    if (maxRate) query = query.lte("hourly_rate", parseFloat(maxRate))
    if (verifiedOnly) query = query.eq("is_verified", true)

    const { data } = await query
    let results = (data as Freelancer[]) || []

    if (search) {
      const s = search.toLowerCase()
      results = results.filter(
        f =>
          f.full_name?.toLowerCase().includes(s) ||
          f.bio?.toLowerCase().includes(s) ||
          f.skills?.some(sk => sk.toLowerCase().includes(s))
      )
    }

    if (skillFilter) {
      results = results.filter(f =>
        f.skills?.some(sk => sk.toLowerCase().includes(skillFilter.toLowerCase()))
      )
    }

    setFreelancers(results)
    setLoading(false)
  }, [search, skillFilter, maxRate, verifiedOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchFreelancers()
  }, [fetchFreelancers])

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-8">Find Freelancers</h1>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, bio, or skills..."
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-9 focus:border-[#FFD700]"
          />
        </div>

        {/* Skill Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setSkillFilter("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              skillFilter === ""
                ? "bg-[#FFD700] text-black border-[#FFD700]"
                : "bg-white/5 text-[#6B7280] border-white/10 hover:border-white/30"
            }`}
          >
            All Skills
          </button>
          {SKILL_FILTERS.map(skill => (
            <button
              key={skill}
              onClick={() => setSkillFilter(skillFilter === skill ? "" : skill)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                skillFilter === skill
                  ? "bg-[#FFD700] text-black border-[#FFD700]"
                  : "bg-white/5 text-[#6B7280] border-white/10 hover:border-white/30"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Max Rate + Verified */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">₹</span>
            <Input
              type="number"
              value={maxRate}
              onChange={e => setMaxRate(e.target.value)}
              placeholder="Max hourly rate"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-7 w-44 focus:border-[#FFD700]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-[#FFD700]"
            />
            <span className="text-gray-300 text-sm">Verified only</span>
          </label>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading freelancers...</div>
        ) : freelancers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No freelancers found.</div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{freelancers.length} freelancer{freelancers.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {freelancers.map(f => (
                <FreelancerCard key={f.id} freelancer={f} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
