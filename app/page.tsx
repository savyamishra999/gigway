import { createPublicClient } from "@/lib/supabase/public"
import { Suspense } from "react"
import { withDeadline } from "@/lib/async"
import { SectionLoading, SectionUnavailable } from "@/components/layout/SectionStatus"
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

async function LandingData({ kind }: { kind: "stats" | "opportunities" }) {
  try {
    const db = createPublicClient()
    if (kind === "stats") {
      const results = await withDeadline(Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }).eq("profile_completed", true),
        db.from("gigs").select("*", { count: "exact", head: true }).eq("status", "active"),
        db.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
        db.from("projects").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]))
      if (results.some(result => result.error)) throw Error()
      return <LiveStats professionals={results[0].count ?? 0} services={results[1].count ?? 0} jobs={results[2].count ?? 0} projects={results[3].count ?? 0} />
    }
    const [jobs, projects, gigs] = await withDeadline(Promise.all([
      db.from("jobs").select("id,title,company_name,location,salary_min,salary_max,skills_required,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(6),
      db.from("projects").select("id,title,budget,category,skills_required,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(6),
      db.from("gigs").select("id,title,price,delivery_days,image_url,category,profiles:freelancer_id(full_name,avg_rating,is_verified)").eq("status", "active").order("orders_count", { ascending: false }).limit(6),
    ]))
    if (jobs.error || projects.error || gigs.error) throw Error()
    return <RealOpportunities jobs={jobs.data ?? []} projects={projects.data ?? []} gigs={gigs.data ?? []} />
  } catch { return <SectionUnavailable href="/" /> }
}

export default function HomePage() {
  return <main>
    <Hero />
    <Suspense fallback={<SectionLoading label="Loading community stats..." />}><LandingData kind="stats" /></Suspense>
    <ProfessionalIdentity />
    <WhatYouCanDo />
    <Suspense fallback={<SectionLoading label="Loading opportunities..." />}><LandingData kind="opportunities" /></Suspense>
    <Suspense fallback={<SectionLoading label="Loading professionals..." />}><FeaturedFreelancers /></Suspense>
    <Suspense fallback={<SectionLoading label="Loading Workplaces..." />}><OrganizationsPreview /></Suspense>
    <TrustVerification />
    <HomePricing />
    <WhyGigway />
    <FinalCTA />
  </main>
}
