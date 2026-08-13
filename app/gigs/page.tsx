import { createClient } from "@/lib/supabase/server"
import GigsClient from "@/components/gigs/GigsClient"
import BannerAd from "@/components/ads/BannerAd"
import { fetchAd } from "@/lib/ads"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Services | GigWay",
  description: "Find services from professionals across design, technology, marketing, writing and more. Zero commission on GigWay.",
  openGraph: {
    title: "Browse Services | GigWay",
    description: "GigWay's global services marketplace — zero commission, book instantly.",
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
      .select("id, title, price, delivery_days, category, tags, rating, orders_count, image_url, freelancer_id, owner_id, created_at, is_featured, featured_until, profiles:freelancer_id(full_name, username, avg_rating, is_verified)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("orders_count",  { ascending: false })
      .order("created_at",    { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  // Only freelancers can create gigs
  let canCreateGig = false
  let gigRoles: string[] = []
  let gigFwType: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_roles, find_work_type")
      .eq("id", user.id)
      .single()
    gigRoles   = (profile?.user_roles as string[] | null) ?? []
    gigFwType  = profile?.find_work_type ?? null
    canCreateGig = gigRoles.includes("find_work") && gigFwType !== "job_seeker"
  }

  const ad = await fetchAd("gigs", gigRoles, gigFwType, null)

  return (
    <div className="min-h-screen bg-brand-ivory">
      {/* Header */}
      <div className="bg-white border-b border-brand-borderLight py-10 sm:py-14">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-h1 font-extrabold text-brand-midnight">Find the right service for your next idea</h1>
              <p className="text-brand-slate text-body-sm sm:text-body-lg mt-2 max-w-xl">
                Discover services from professionals across design, technology, marketing, writing and more.
              </p>
            </div>
            {canCreateGig && (
              <Link href="/gigs/new"
                className="flex-shrink-0 bg-brand-indigo hover:bg-brand-indigoDark text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)]"
              >
                + Create a Service
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {ad && <BannerAd ad={ad} className="mb-6" />}
        <GigsClient initialGigs={initialGigs ?? []} />
      </div>
    </div>
  )
}
