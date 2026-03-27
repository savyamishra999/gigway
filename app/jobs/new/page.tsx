import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import JobForm from "@/components/jobs/JobForm"

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single()

  if (!profile?.profile_completed) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-[#0F172A] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <JobForm userId={user.id} />
      </div>
    </div>
  )
}
