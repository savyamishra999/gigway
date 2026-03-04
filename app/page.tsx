import Hero from "@/components/home/Hero"
import HowItWorks from "@/components/home/HowItWorks"
import FeaturedFreelancers from "@/components/home/FeaturedFreelancers"
import LatestProjects from "@/components/home/LatestProjects"
import WhyGigway from "@/components/home/WhyGigway"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <FeaturedFreelancers />
      <LatestProjects />
      <WhyGigway />
    </main>
  )
}