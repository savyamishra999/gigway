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
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      <EditProfileForm profile={profile} userId={user.id} />
    </div>
  )
}