import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileSkills from "@/components/profile/ProfileSkills"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProfilePage() {
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
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <ProfileHeader profile={profile} userEmail={user.email} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium">{profile?.full_name || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Bio</p>
            <p>{profile?.bio || "No bio yet."}</p>
          </div>
          {profile?.user_type === "freelancer" && (
            <>
              <div>
                <p className="text-sm text-gray-500">Hourly Rate (₹)</p>
                <p className="font-medium">{profile?.hourly_rate || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skills</p>
                <ProfileSkills skills={profile?.skills || []} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <a
          href="/profile/edit"
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black px-4 py-2 rounded-md transition"
        >
          Edit Profile
        </a>
      </div>
    </div>
  )
}