import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import GigCard from "@/components/gigs/GigCard"

export default async function FeaturedGigs() {
  const supabase = await createClient()
  const { data: gigs } = await supabase
    .from("gigs")
    .select("*, profiles:freelancer_id(full_name, avg_rating, is_verified)")
    .eq("status", "active")
    .order("orders_count", { ascending: false })
    .limit(6)

  if (!gigs || gigs.length === 0) return null

  return (
    <section className="py-24 px-4 bg-[#0A0A0F]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[#F97316] text-sm font-bold uppercase tracking-widest mb-2">Trending</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Trending Gigs on{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">GigWay</span>
            </h2>
          </div>
          <Link href="/gigs" className="hidden md:inline-flex text-[#818CF8] hover:text-[#4F46E5] text-sm font-semibold transition-colors">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gigs.map(gig => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link href="/gigs" className="text-[#818CF8] font-semibold text-sm hover:underline">
            View All Gigs →
          </Link>
        </div>
      </div>
    </section>
  )
}
