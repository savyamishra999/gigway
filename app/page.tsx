import { createClient } from "@/lib/supabase/server"
import Hero from "@/components/home/Hero"
import LiveStats from "@/components/home/LiveStats"
import ProfessionalIdentity from "@/components/home/ProfessionalIdentity"
import WhatYouCanDo from "@/components/home/WhatYouCanDo"
import RealOpportunities from "@/components/home/RealOpportunities"
import FeaturedFreelancers from "@/components/home/FeaturedFreelancers"
import OrganizationsPreview from "@/components/home/OrganizationsPreview"
import TrustVerification from "@/components/home/TrustVerification"
import HomePricing from "@/components/home/HomePricing"
import WhyGigway from "@/components/home/WhyGigway"
import FinalCTA from "@/components/home/FinalCTA"

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { count: professionalCount },
    { count: serviceCount },
    { count: jobCount },
    { count: projectCount },
    { data: jobs },
    { data: projects },
    { data: gigs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_completed", true),
    supabase.from("gigs").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("jobs")
      .select("id, title, company_name, location, salary_min, salary_max, skills_required, created_at")
      .eq("status", "active").order("created_at", { ascending: false }).limit(6),
    supabase.from("projects")
      .select("id, title, budget, category, skills_required, created_at")
      .eq("status", "open").order("created_at", { ascending: false }).limit(6),
    supabase.from("gigs")
      .select("id, title, price, delivery_days, image_url, category, profiles:freelancer_id(full_name, avg_rating, is_verified)")
      .eq("status", "active").order("orders_count", { ascending: false }).limit(6),
  ])

  return (
    <main>
      <Hero />
      <LiveStats
        professionals={professionalCount ?? 0}
        services={serviceCount ?? 0}
        jobs={jobCount ?? 0}
        projects={projectCount ?? 0}
      />
      <ProfessionalIdentity />
      <WhatYouCanDo />
      <RealOpportunities jobs={jobs ?? []} projects={projects ?? []} gigs={gigs ?? []} />
      <FeaturedFreelancers />
      <OrganizationsPreview />
      <TrustVerification />
      <HomePricing />
      <WhyGigway />
      <FinalCTA />
    </main>
  )
}
