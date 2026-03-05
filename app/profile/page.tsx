import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileSkills from "@/components/profile/ProfileSkills"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-12">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <Link href="/profile/edit">
            <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black">
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader profile={profile} userEmail={user.email} />

          {/* Basic Info Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="font-medium text-white">{profile?.full_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Bio</p>
                <p className="text-white">{profile?.bio || "No bio yet."}</p>
              </div>
              {profile?.user_type === "freelancer" || profile?.user_type === "both" ? (
                <>
                  <div>
                    <p className="text-sm text-gray-400">Hourly Rate (₹)</p>
                    <p className="font-medium text-white">
                      {profile?.hourly_rate ? `₹${profile.hourly_rate}/hr` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Skills</p>
                    <ProfileSkills skills={profile?.skills || []} />
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}