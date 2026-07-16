import { createClient } from "@/lib/supabase/server"
import FreelancersClient from "@/components/freelancers/FreelancersClient"
import BannerAd from "@/components/ads/BannerAd"
import { fetchAd } from "@/lib/ads"
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
  let flRoles: string[] = []
  let flHtType: string | null = null
  if (user) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("is_boosted, boost_expires_at, is_verified, subscription_tier, user_roles, hire_talent_type")
      .eq("id", user.id)
      .single()
    isProUser = !!(
      (myProfile?.is_boosted && myProfile?.boost_expires_at && new Date(myProfile.boost_expires_at) > new Date()) ||
      myProfile?.is_verified ||
      (myProfile?.subscription_tier && ["pro", "business"].includes(myProfile.subscription_tier))
    )
    flRoles  = (myProfile?.user_roles as string[] | null) ?? []
    flHtType = myProfile?.hire_talent_type ?? null
  }

  const ad = await fetchAd("freelancers", flRoles, null, flHtType)

  // Ranking algorithm:
  // Tier 1 — Boosted (paid boost_basic/standard/premium or find_work plan)
  // Tier 2 — Plan active but not boosted (find_work plan, boost expired or never set)
  // Tier 3 — Verified profiles
  // Tier 4 — Rest, by rating

  const { data: boosted } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability, plan, plan_expires_at")
    .eq("profile_completed", true)
    .eq("is_boosted", true)
    .gt("boost_expires_at", now)
    .order("boost_expires_at", { ascending: false })
    .limit(6)

  const boostedIds = boosted && boosted.length > 0
    ? `(${boosted.map(b => `"${b.id}"`).join(",")})`
    : `("00000000-0000-0000-0000-000000000000")`

  // Tier 2: plan-active but not in boosted list
  const { data: planActive } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability, plan, plan_expires_at")
    .eq("profile_completed", true)
    .eq("plan", "find_work")
    .gt("plan_expires_at", now)
    .not("id", "in", boostedIds)
    .order("avg_rating", { ascending: false })
    .limit(10)

  const planActiveIds = planActive && planActive.length > 0
    ? `(${[...boosted ?? [], ...planActive].map(b => `"${b.id}"`).join(",")})`
    : boostedIds

  // Tier 3 + 4: rest
  const { data: rest } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, hourly_rate, skills, is_verified, is_boosted, boost_expires_at, avg_rating, availability, plan, plan_expires_at")
    .eq("profile_completed", true)
    .not("id", "in", planActiveIds)
    .order("is_verified", { ascending: false })
    .order("avg_rating",  { ascending: false })
    .limit(44)

  const initialFreelancers = [...(boosted ?? []), ...(planActive ?? []), ...(rest ?? [])]

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-2">Find Freelancers</h1>
        <p className="text-[#6B7280] text-sm mb-6">India&apos;s top verified freelancers — zero commission</p>

        {ad && <BannerAd ad={ad} className="mb-8" />}
        <FreelancersClient initialFreelancers={initialFreelancers} isProUser={isProUser} />
      </div>
    </div>
  )
}
