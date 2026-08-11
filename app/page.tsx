import { createClient } from "@/lib/supabase/server"
import Hero from "@/components/home/Hero"
import TrustBar from "@/components/home/TrustBar"
import HowItWorks from "@/components/home/HowItWorks"
import ProfessionalIdentity from "@/components/home/ProfessionalIdentity"
import FindWorkFindTalent from "@/components/home/FindWorkFindTalent"
import JobsPreview from "@/components/home/JobsPreview"
import FeaturedGigs from "@/components/home/FeaturedGigs"
import LatestProjects from "@/components/home/LatestProjects"
import FeaturedFreelancers from "@/components/home/FeaturedFreelancers"
import OrganizationsPreview from "@/components/home/OrganizationsPreview"
import AIToolsSection from "@/components/home/AIToolsSection"
import WhyGigway from "@/components/home/WhyGigway"
import HomePricing from "@/components/home/HomePricing"
import FinalCTA from "@/components/home/FinalCTA"

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { count: freelancerCount },
    { count: gigCount },
    { count: jobCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_completed", true),
    supabase.from("gigs").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
  ])

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <Hero freelancerCount={freelancerCount ?? 0} gigCount={gigCount ?? 0} jobCount={jobCount ?? 0} />
      <TrustBar freelancerCount={freelancerCount ?? 0} />
      <HowItWorks />
      <ProfessionalIdentity />
      <FindWorkFindTalent />
      <JobsPreview />
      <FeaturedGigs />
      <LatestProjects />
      <FeaturedFreelancers />
      <OrganizationsPreview />
      <AIToolsSection />
      <WhyGigway />
      <HomePricing />
      <FinalCTA />
    </main>
  )
}
