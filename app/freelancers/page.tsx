import { createClient } from "@/lib/supabase/server"
import FreelancersClient from "@/components/freelancers/FreelancersClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Freelancers in India | GigWay",
  description: "Hire top Indian freelancers for design, development, writing, marketing, and more. Zero commission. Browse verified profiles on GigWay.",
  openGraph: {
    title: "Find Freelancers in India | GigWay",
    description: "India's zero-commission freelance platform. Hire top talent instantly.",
    type: "website",
  },
}

export default async function FreelancersPage() {
  const supabase = await createClient()

  const now = new Date().toISOString()

  // Check if the logged-in user has a paid plan (boost, verified, or pro)
  const { data: { user } } = await supabase.auth.getUser()
  let isProUser = false
  if (user) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("is_boosted, boost_expires_at, is_verified, subscription_tier")
      .eq("id", user.id)
      .single()
    isProUser = !!(
      (myProfile?.is_boosted && myProfile?.boost_expires_at && new Date(myProfile.boost_expires_at) > new Date()) ||
      myProfile?.is_verified ||
      (myProfile?.subscription_tier && ["pro", "business"].includes(myProfile.subscription_tier))
    )
  }

  // SSR: fetch initial data — boosted first, then by rating
  const { data: boosted } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability")
    .eq("profile_completed", true)
    .eq("is_boosted", true)
    .gt("boost_expires_at", now)
    .order("boost_expires_at", { ascending: false })
    .limit(3)

  const { data: rest } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability")
    .eq("profile_completed", true)
    .not("id", "in", boosted && boosted.length > 0 ? `(${boosted.map(b => `"${b.id}"`).join(",")})` : `("")`)
    .order("avg_rating", { ascending: false })
    .limit(48)

  const initialFreelancers = [...(boosted ?? []), ...(rest ?? [])]

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-2">Find Freelancers</h1>
        <p className="text-[#6B7280] text-sm mb-8">India&apos;s top verified freelancers — zero commission</p>

        <FreelancersClient initialFreelancers={initialFreelancers} isProUser={isProUser} />
      </div>
    </div>
  )
}
