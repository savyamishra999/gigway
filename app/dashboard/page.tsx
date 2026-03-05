import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard"
import ClientDashboard from "@/components/dashboard/ClientDashboard"
import BothDashboard from "@/components/dashboard/BothDashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (error || !profile?.user_type) {
    // अगर profile नहीं मिली या user_type सेट नहीं, तो onboarding पर भेजो
    redirect("/onboarding")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        
        {profile.user_type === "freelancer" && <FreelancerDashboard userId={user.id} />}
        {profile.user_type === "client" && <ClientDashboard userId={user.id} />}
        {profile.user_type === "both" && <BothDashboard userId={user.id} />}
      </div>
    </div>
  )
}