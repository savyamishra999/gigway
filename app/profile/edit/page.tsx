import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditProfileForm from "@/components/profile/EditProfileForm"

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Edit Profile</h1>
        <EditProfileForm profile={profile} userId={user.id} />
      </div>
    </div>
  )
}
