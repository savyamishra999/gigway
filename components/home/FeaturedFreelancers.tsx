import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function FeaturedFreelancers() {
  const supabase = await createClient()
  const { data: freelancers } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", "freelancer")
    .not("avatar_url", "is", null)
    .limit(8)

  if (!freelancers || freelancers.length === 0) {
    return null
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          Featured <span className="text-[#FFD700]">Freelancers</span>
        </h2>

        <div className="relative">
          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x">
            {freelancers.map((freelancer) => {
              const initials = freelancer.full_name
                ? freelancer.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                : "U"

              return (
                <Link
                  key={freelancer.id}
                  href={`/freelancers/${freelancer.id}`}
                  className="group flex-shrink-0 w-64 md:w-auto snap-start"
                >
                  <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:border-[#FFD700] transition-all hover:scale-105">
                    {freelancer.is_verified && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#FFD700] text-black">✓ Verified</Badge>
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-24 h-24 mb-4 ring-4 ring-[#FFD700]/20">
                        <AvatarImage src={freelancer.avatar_url || ""} />
                        <AvatarFallback className="bg-[#FFD700] text-black text-xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <h3 className="text-xl font-semibold text-white mb-1">
                        {freelancer.full_name || "Anonymous"}
                      </h3>

                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <p className="text-sm text-gray-300 mb-3">
                          {freelancer.skills.slice(0, 3).join(" • ")}
                        </p>
                      )}

                      {freelancer.hourly_rate && (
                        <p className="text-[#FFD700] font-bold">
                          ₹{freelancer.hourly_rate}/hr
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/freelancers"
            className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 font-semibold"
          >
            View All Freelancers →
          </Link>
        </div>
      </div>
    </section>
  )
}