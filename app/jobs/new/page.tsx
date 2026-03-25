import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import JobForm from "@/components/jobs/JobForm"

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Only clients can post jobs
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (!profile?.user_type) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <JobForm userId={user.id} />
      </div>
    </div>
  )
}
