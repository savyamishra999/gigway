import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProjectForm from "@/components/projects/ProjectForm"

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user has user_type = client or both, else redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.user_type !== "client" && profile.user_type !== "both")) {
    // Redirect if not allowed
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D4A5A5] to-[#A7C7E7] py-12">
      <div className="container mx-auto max-w-2xl p-4">
        <ProjectForm userId={user.id} />
      </div>
    </div>
  )
}