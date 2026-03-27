import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProjectForm from "@/components/projects/ProjectForm"

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single()

  if (!profile?.profile_completed) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-[#0F172A] py-12">
      <div className="container mx-auto max-w-2xl p-4">
        <ProjectForm userId={user.id} />
      </div>
    </div>
  )
}