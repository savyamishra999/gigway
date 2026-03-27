"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal } from "lucide-react"
import GigCard from "@/components/gigs/GigCard"
import Link from "next/link"

const CATEGORIES = ["All", "Design", "Development", "Writing", "Marketing", "Video", "Other"]
const PRICE_FILTERS = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹2000", min: 500, max: 2000 },
  { label: "₹2000+", min: 2000, max: Infinity },
]
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "top_rated" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
]

interface Gig {
  id: string; title: string; price: number; delivery_days: number
  category: string | null; tags: string[] | null; rating: number
  orders_count: number; image_url: string | null
  created_at: string; freelancer_id: string | null; owner_id: string | null
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [priceIdx, setPriceIdx] = useState(0)
  const [sort, setSort] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClient()

  const fetchGigs = useCallback(async () => {
    setLoading(true)
    setError("")
    let query = supabase
      .from("gigs")
      .select("id, title, price, delivery_days, category, tags, rating, orders_count, freelancer_id, owner_id, created_at")
      .eq("status", "active")

    if (category !== "All") query = query.ilike("category", category)

    if (sort === "top_rated") query = query.order("rating", { ascending: false })
    else if (sort === "price_asc") query = query.order("price", { ascending: true })
    else if (sort === "price_desc") query = query.order("price", { ascending: false })
    else query = query.order("created_at", { ascending: false })

    const { data, error: fetchError } = await query
    console.log("Gigs result:", { data, error: fetchError })

    if (fetchError) {
      console.error("Gigs error:", fetchError)
      setError(fetchError.message)
      setGigs([])
      setLoading(false)
      return
    }

    let results = (data as Gig[]) || []

    const { min, max } = PRICE_FILTERS[priceIdx]
    results = results.filter(g => g.price >= min && g.price <= max)

    if (search) {
      const s = search.toLowerCase()
      results = results.filter(g =>
        g.title?.toLowerCase().includes(s) ||
        g.tags?.some(t => t.toLowerCase().includes(s))
      )
    }

    setGigs(results)
    setLoading(false)
  }, [search, category, priceIdx, sort]) // eslint-disable-line

  useEffect(() => { fetchGigs() }, [fetchGigs])

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border-b border-[#1E1E2E] py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-white">Browse Gigs</h1>
              <p className="text-[#6B7280] text-sm mt-1">Find top freelance services across India</p>
            </div>
            <Link href="/gigs/new"
              className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity"
            >
              + Create Gig
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search gigs, skills, services..."
              className="bg-[#12121A] border-[#1E1E2E] text-white placeholder:text-[#6B7280] pl-9 focus:border-[#4F46E5] h-11"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    category === c
                      ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-lg shadow-[#4F46E5]/20"
                      : "bg-transparent text-[#6B7280] border-[#1E1E2E] hover:border-[#4F46E5]/50 hover:text-white"
                  }`}
                >{c}</button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Price filter */}
              <div className="flex items-center gap-1 bg-[#12121A] border border-[#1E1E2E] rounded-xl px-3 py-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" />
                <select value={priceIdx} onChange={e => setPriceIdx(Number(e.target.value))}
                  className="bg-transparent text-[#9CA3AF] text-xs outline-none cursor-pointer"
                >
                  {PRICE_FILTERS.map((f, i) => <option key={i} value={i}>{f.label}</option>)}
                </select>
              </div>
              {/* Sort */}
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl px-3 py-1.5">
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-transparent text-[#9CA3AF] text-xs outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded-full w-3/4" />
                  <div className="h-3 skeleton rounded-full w-1/2" />
                  <div className="h-8 skeleton rounded-full w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 font-semibold mb-2">Failed to load gigs</p>
            <p className="text-[#6B7280] text-sm">Error: {error}</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">
            <p className="text-lg mb-2">No gigs yet!</p>
            <Link href="/gigs/new" className="text-[#4F46E5] hover:underline text-sm inline-block">
              Create the first gig →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[#6B7280] text-sm mb-5">{gigs.length} gig{gigs.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
