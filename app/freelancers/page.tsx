import { createClient } from "@/lib/supabase/server"
import FreelancerCard from "@/components/freelancers/FreelancerCard"

export default async function FreelancersPage() {
  const supabase = await createClient()
  const { data: freelancers } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", "freelancer")

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Find Freelancers</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {freelancers?.map((freelancer) => (
          <FreelancerCard key={freelancer.id} freelancer={freelancer} />
        ))}
      </div>
    </div>
  )
}