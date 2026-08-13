"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, SlidersHorizontal, Star, X } from "lucide-react"
import GigCard, { type Gig } from "@/components/gigs/GigCard"
import Link from "next/link"

const CATEGORIES = ["All", "Design", "Development", "Writing", "Marketing", "Video", "Other"]
const PRICE_FILTERS = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹2,000", min: 500, max: 2000 },
  { label: "₹2,000+", min: 2000, max: Infinity },
]
const RATING_FILTERS = [
  { label: "Any Rating", value: 0 },
  { label: "4.0 & up", value: 4 },
  { label: "4.5 & up", value: 4.5 },
]
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "top_rated" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
]

interface Props {
  initialGigs: Gig[]
}

export default function GigsClient({ initialGigs }: Props) {
  const [gigs, setGigs] = useState<Gig[]>(initialGigs)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [priceIdx, setPriceIdx] = useState(0)
  const [ratingIdx, setRatingIdx] = useState(0)
  const [skillFilter, setSkillFilter] = useState("")
  const [sort, setSort] = useState("newest")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const supabase = createClient()

  const SKILL_FILTERS = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const g of initialGigs) {
      for (const tag of g.tags ?? []) freq[tag] = (freq[tag] ?? 0) + 1
    }
    return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 10).map(([tag]) => tag)
  }, [initialGigs])

  const hasActiveFilters = !!(search || category !== "All" || priceIdx !== 0 || ratingIdx !== 0 || skillFilter || sort !== "newest")
  const activeCount = [category !== "All", priceIdx !== 0, ratingIdx !== 0, !!skillFilter].filter(Boolean).length

  const fetchGigs = useCallback(async () => {
    setLoading(true)
    setError("")
    let query = supabase
      .from("gigs")
      .select("id, title, price, delivery_days, category, tags, rating, orders_count, image_url, freelancer_id, owner_id, created_at, is_featured, featured_until, profiles:freelancer_id(full_name, username, avg_rating, is_verified)")
      .eq("status", "active")

    if (category !== "All") query = query.ilike("category", category)
    if (RATING_FILTERS[ratingIdx].value > 0) query = query.gte("rating", RATING_FILTERS[ratingIdx].value)

    if (sort === "top_rated") query = query.order("rating", { ascending: false })
    else if (sort === "price_asc") query = query.order("price", { ascending: true })
    else if (sort === "price_desc") query = query.order("price", { ascending: false })
    else query = query.order("created_at", { ascending: false })

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
      setGigs([])
      setLoading(false)
      return
    }

    let results = (data as unknown as Gig[]) || []
    const { min, max } = PRICE_FILTERS[priceIdx]
    results = results.filter(g => g.price >= min && g.price <= max)
    if (skillFilter) {
      results = results.filter(g => g.tags?.some(t => t.toLowerCase().includes(skillFilter.toLowerCase())))
    }
    if (search) {
      const s = search.toLowerCase()
      results = results.filter(g =>
        g.title?.toLowerCase().includes(s) ||
        g.tags?.some(t => t.toLowerCase().includes(s))
      )
    }
    setGigs(results)
    setLoading(false)
  }, [search, category, priceIdx, ratingIdx, skillFilter, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasActiveFilters) {
      fetchGigs()
    } else {
      setGigs(initialGigs)
    }
  }, [search, category, priceIdx, ratingIdx, skillFilter, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setSearch(""); setCategory("All"); setPriceIdx(0); setRatingIdx(0); setSkillFilter(""); setSort("newest")
  }

  return (
    <>
      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-indigo" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services, skills or professionals..."
            className="w-full bg-white border-2 border-brand-indigo/15 focus:border-brand-indigo rounded-pill pl-11 pr-4 py-3.5 text-brand-midnight text-sm placeholder:text-brand-slate outline-none transition-all shadow-soft focus:ring-4 focus:ring-brand-indigo/10"
          />
        </div>
        {/* Mobile filters trigger */}
        <button type="button" onClick={() => setDrawerOpen(true)}
          className="sm:hidden relative flex-shrink-0 flex items-center justify-center gap-2 px-4 rounded-pill border border-brand-borderLight bg-white text-brand-midnight text-sm font-semibold shadow-soft">
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-brand-coral text-white text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Desktop filters */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
                category === c
                  ? "bg-brand-indigo text-white border-brand-indigo"
                  : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-indigo/40 hover:text-brand-midnight"
              }`}
            >{c}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <select value={priceIdx} onChange={e => setPriceIdx(Number(e.target.value))}
            className="bg-white border border-brand-borderLight rounded-xl px-3 py-2 text-brand-slate text-xs outline-none cursor-pointer">
            {PRICE_FILTERS.map((f, i) => <option key={i} value={i}>{f.label}</option>)}
          </select>
          <select value={ratingIdx} onChange={e => setRatingIdx(Number(e.target.value))}
            className="bg-white border border-brand-borderLight rounded-xl px-3 py-2 text-brand-slate text-xs outline-none cursor-pointer">
            {RATING_FILTERS.map((f, i) => <option key={i} value={i}>{f.label}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-white border border-brand-borderLight rounded-xl px-3 py-2 text-brand-slate text-xs outline-none cursor-pointer">
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Skill/tag chips */}
      {SKILL_FILTERS.length > 0 && (
        <div className="hidden sm:flex flex-wrap gap-2 mb-6">
          <button onClick={() => setSkillFilter("")}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
              skillFilter === ""
                ? "bg-brand-coral text-white border-brand-coral"
                : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-coral/40 hover:text-brand-midnight"
            }`}
          >All skills</button>
          {SKILL_FILTERS.map(skill => (
            <button key={skill} onClick={() => setSkillFilter(skillFilter === skill ? "" : skill)}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-all border ${
                skillFilter === skill
                  ? "bg-brand-coral text-white border-brand-coral"
                  : "bg-white text-brand-slate border-brand-borderLight hover:border-brand-coral/40 hover:text-brand-midnight"
              }`}
            >{skill}</button>
          ))}
        </div>
      )}

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-brand-midnight font-bold text-lg">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-1.5 rounded-lg text-brand-slate hover:bg-brand-ivory">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-brand-midnight font-semibold text-sm mb-2.5">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`px-4 py-2 rounded-pill text-sm font-medium border ${category === c ? "bg-brand-indigo text-white border-brand-indigo" : "bg-white text-brand-slate border-brand-borderLight"}`}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-brand-midnight font-semibold text-sm mb-2.5">Price</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_FILTERS.map((f, i) => (
                    <button key={i} onClick={() => setPriceIdx(i)}
                      className={`px-4 py-2 rounded-pill text-sm font-medium border ${priceIdx === i ? "bg-brand-midnight text-white border-brand-midnight" : "bg-white text-brand-slate border-brand-borderLight"}`}
                    >{f.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-brand-midnight font-semibold text-sm mb-2.5">Rating</p>
                <div className="flex flex-wrap gap-2">
                  {RATING_FILTERS.map((f, i) => (
                    <button key={i} onClick={() => setRatingIdx(i)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-pill text-sm font-medium border ${ratingIdx === i ? "bg-brand-indigo text-white border-brand-indigo" : "bg-white text-brand-slate border-brand-borderLight"}`}
                    ><Star className="h-3 w-3" /> {f.label}</button>
                  ))}
                </div>
              </div>
              {SKILL_FILTERS.length > 0 && (
                <div>
                  <p className="text-brand-midnight font-semibold text-sm mb-2.5">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_FILTERS.map(skill => (
                      <button key={skill} onClick={() => setSkillFilter(skillFilter === skill ? "" : skill)}
                        className={`px-4 py-2 rounded-pill text-sm font-medium border ${skillFilter === skill ? "bg-brand-coral text-white border-brand-coral" : "bg-white text-brand-slate border-brand-borderLight"}`}
                      >{skill}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-brand-midnight font-semibold text-sm mb-2.5">Sort by</p>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="w-full bg-white border border-brand-borderLight rounded-xl px-3 py-2.5 text-brand-midnight text-sm outline-none">
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={clearFilters} className="flex-1 py-3 rounded-xl border border-brand-borderLight text-brand-slate font-semibold text-sm">Clear all</button>
              <button onClick={() => setDrawerOpen(false)} className="flex-1 py-3 rounded-xl bg-brand-indigo text-white font-semibold text-sm">Show results</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-brand-borderLight rounded-card overflow-hidden">
              <div className="h-44 animate-pulse bg-brand-ivory" />
              <div className="p-4 space-y-3">
                <div className="h-4 animate-pulse bg-brand-ivory rounded-full w-3/4" />
                <div className="h-3 animate-pulse bg-brand-ivory rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white border border-red-200 rounded-card">
          <p className="text-red-600 font-semibold mb-2">Failed to load services</p>
          <p className="text-brand-slate text-sm">Please try again in a moment.</p>
        </div>
      ) : gigs.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 bg-white border border-brand-borderLight rounded-card px-8">
          {hasActiveFilters ? (
            <>
              <Search className="h-10 w-10 text-brand-slate/40 mb-4" />
              <h3 className="text-brand-midnight font-bold text-xl mb-2">No services match these filters.</h3>
              <button onClick={clearFilters} className="mt-2 text-brand-indigo font-semibold text-sm hover:text-brand-indigoDark">Clear filters</button>
            </>
          ) : (
            <>
              <Search className="h-10 w-10 text-brand-slate/40 mb-4" />
              <h3 className="text-brand-midnight font-bold text-xl mb-2">Be the first to offer a service in this category.</h3>
              <p className="text-brand-slate text-sm mb-6 max-w-xs">Showcase what you do best and start attracting clients today.</p>
              <Link href="/gigs/new"
                className="bg-brand-indigo text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-indigoDark transition-colors text-sm"
              >
                Create a Service →
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="text-brand-slate text-body-sm mb-5">{gigs.length} service{gigs.length !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
          </div>
        </>
      )}
    </>
  )
}
