import Hero from "@/components/home/Hero"
import TrustBar from "@/components/home/TrustBar"
import HowItWorks from "@/components/home/HowItWorks"
import FeaturedGigs from "@/components/home/FeaturedGigs"
import FeaturedFreelancers from "@/components/home/FeaturedFreelancers"
import LatestProjects from "@/components/home/LatestProjects"
import WhyGigway from "@/components/home/WhyGigway"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <Hero />
      <TrustBar />
      <HowItWorks />
      <FeaturedGigs />
      <FeaturedFreelancers />
      <LatestProjects />
      <WhyGigway />
    </main>
  )
}
