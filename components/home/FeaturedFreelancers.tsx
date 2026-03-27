import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import FreelancerCard from "@/components/freelancers/FreelancerCard"

export default async function FeaturedFreelancers() {
  const supabase = await createClient()
  const { data: freelancers } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, avg_rating, availability")
    .eq("is_verified", true)
    .eq("profile_completed", true)
    .order("avg_rating", { ascending: false })
    .limit(6)

  if (!freelancers || freelancers.length === 0) return null

  return (
    <section className="py-24 px-4 bg-[#0D0D0D]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[#FFD700] text-sm font-semibold uppercase tracking-widest mb-2">Top Talent</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Featured <span className="text-[#FFD700]">Freelancers</span>
            </h2>
          </div>
          <Link
            href="/freelancers"
            className="hidden md:inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 text-sm font-semibold transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {freelancers.map(freelancer => (
            <FreelancerCard key={freelancer.id} freelancer={freelancer} />
          ))}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link href="/freelancers" className="text-[#FFD700] font-semibold text-sm hover:underline">
            View All Freelancers →
          </Link>
        </div>
      </div>
    </section>
  )
}
