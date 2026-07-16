import { createClient } from "@/lib/supabase/server"
import GigsClient from "@/components/gigs/GigsClient"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Gigs | GigWay — India's Freelance Marketplace",
  description: "Find top freelance gigs in India for design, development, writing, marketing, and more. Zero commission on GigWay.",
  openGraph: {
    title: "Browse Gigs | GigWay",
    description: "India's best freelance gig marketplace. No commission, instant hire.",
    type: "website",
  },
}

export default async function GigsPage() {
  const supabase = await createClient()

  const [
    { data: initialGigs },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("gigs")
      .select("id, title, price, delivery_days, category, tags, rating, orders_count, image_url, freelancer_id, owner_id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.auth.getUser(),
  ])

  // Only freelancers can create gigs
  let canCreateGig = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_roles, find_work_type")
      .eq("id", user.id)
      .single()
    const roles   = (profile?.user_roles as string[] | null) ?? []
    const fwType  = profile?.find_work_type
    canCreateGig  = roles.includes("find_work") && fwType !== "job_seeker"
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border-b border-[#1E1E2E] py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-white">Browse Gigs</h1>
              <p className="text-[#6B7280] text-sm mt-1">Find top freelance services across India — zero commission</p>
            </div>
            {canCreateGig && (
              <Link href="/gigs/new"
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity"
              >
                + Create Gig
              </Link>
            )}
          </div>

          <GigsClient initialGigs={initialGigs ?? []} />
        </div>
      </div>
    </div>
  )
}
