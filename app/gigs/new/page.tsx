import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import GigForm from "@/components/gigs/GigForm"

export default async function NewGigPage() {
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
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <GigForm userId={user.id} />
      </div>
    </div>
  )
}
