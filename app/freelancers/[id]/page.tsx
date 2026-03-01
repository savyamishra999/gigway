import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function FreelancerPage(props: any) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: freelancer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (!freelancer) return notFound()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{freelancer.full_name}</h1>
      <p className="mt-2">{freelancer.bio}</p>
      <p className="mt-4">Hourly Rate: ₹{freelancer.hourly_rate}</p>
    </div>
  )
}