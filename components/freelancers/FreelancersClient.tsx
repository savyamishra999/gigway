"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import FreelancerCard from "@/components/freelancers/FreelancerCard"
import { Input } from "@/components/ui/input"
import { Search, Star } from "lucide-react"

interface Freelancer {
  id: string
  full_name: string | null
  avatar_url: string | null
  tagline: string | null
  bio: string | null
  hourly_rate: number | null
  skills: string[] | null
  is_verified: boolean | null
  is_boosted: boolean | null
  boost_expires_at: string | null
  avg_rating: number | null
  availability: string | null
}

const SKILL_FILTERS = ["React", "Next.js", "TypeScript", "Node.js", "Python", "Figma", "UI/UX", "WordPress"]
const MAX_FEATURED = 3

interface Props {
  initialFreelancers: Freelancer[]
}

export default function FreelancersClient({ initialFreelancers }: Props) {
  const [freelancers, setFreelancers] = useState<Freelancer[]>(initialFreelancers)
  const [search, setSearch] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [maxRate, setMaxRate] = useState("")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchFreelancers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("profiles")
      .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability")
      .eq("profile_completed", true)

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

    const now = new Date()
    const boosted = results
      .filter(f => f.is_boosted && f.boost_expires_at && new Date(f.boost_expires_at) > now)
      .slice(0, MAX_FEATURED)
    const boostedIds = new Set(boosted.map(f => f.id))
    const rest = results
      .filter(f => !boostedIds.has(f.id))
      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))

    setFreelancers([...boosted, ...rest])
    setLoading(false)
  }, [search, skillFilter, maxRate, verifiedOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  // Only re-fetch when filters change, not on initial mount (we already have SSR data)
  useEffect(() => {
    if (search || skillFilter || maxRate || verifiedOnly) {
      fetchFreelancers()
    } else {
      // Reset to SSR data when filters cleared
      setFreelancers(initialFreelancers)
    }
  }, [search, skillFilter, maxRate, verifiedOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date()
  const featuredFreelancers = freelancers.filter(
    f => f.is_boosted && f.boost_expires_at && new Date(f.boost_expires_at) > now
  ).slice(0, MAX_FEATURED)
  const regularFreelancers = freelancers.filter(f => !featuredFreelancers.some(b => b.id === f.id))

  return (
    <>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl h-52 animate-pulse" />
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-3">No freelancers found.</p>
          <p className="text-[#6B7280] text-sm">
            Try removing filters or{" "}
            <a href="/profile/edit" className="text-[#FFD700] underline">complete your profile</a> to appear here!
          </p>
        </div>
      ) : (
        <>
          {featuredFreelancers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                <h2 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider">Featured Freelancers</h2>
                <span className="text-[#6B7280] text-xs">· Top picks this month</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredFreelancers.map(f => (
                  <FreelancerCard key={f.id} freelancer={f} />
                ))}
              </div>
              {regularFreelancers.length > 0 && (
                <div className="mt-8 mb-4 border-t border-white/5 pt-6">
                  <p className="text-[#6B7280] text-sm font-medium mb-4">All Freelancers ({regularFreelancers.length})</p>
                </div>
              )}
            </div>
          )}
          {regularFreelancers.length > 0 && (
            <>
              {featuredFreelancers.length === 0 && (
                <p className="text-gray-500 text-sm mb-4">{freelancers.length} freelancer{freelancers.length !== 1 ? "s" : ""} found</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {regularFreelancers.map(f => (
                  <FreelancerCard key={f.id} freelancer={f} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
