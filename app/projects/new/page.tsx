import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProjectForm from "@/components/projects/ProjectForm"

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <ProjectForm userId={user.id} />
      </div>
    </div>
  )
}
