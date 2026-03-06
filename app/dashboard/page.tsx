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
    redirect("/onboarding")
  }

  // Fetch data based on user type
  let projects = []
  let proposals = []
  let clientProjects = []

  if (profile.user_type === "freelancer" || profile.user_type === "both") {
    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5)
    projects = proj || []

    const { data: props } = await supabase
      .from("proposals")
      .select(`
        *,
        projects (title, budget)
      `)
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
    proposals = props || []
  }

  if (profile.user_type === "client" || profile.user_type === "both") {
    const { data: cProj } = await supabase
      .from("projects")
      .select(`
        *,
        proposals(count)
      `)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
    clientProjects = cProj || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        
        {profile.user_type === "freelancer" && (
          <FreelancerDashboard 
            userId={user.id}
            initialProjects={projects}
            initialProposals={proposals}
          />
        )}
        {profile.user_type === "client" && (
          <ClientDashboard 
            userId={user.id}
            initialProjects={clientProjects}
          />
        )}
        {profile.user_type === "both" && (
          <BothDashboard 
            userId={user.id}
            initialProjects={projects}
            initialProposals={proposals}
            initialClientProjects={clientProjects}
          />
        )}
      </div>
    </div>
  )
}