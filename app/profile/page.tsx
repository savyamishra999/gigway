import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, Clock, DollarSign, LinkIcon, Mail, Calendar, Edit } from "lucide-react"

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

  // Fetch portfolio items
  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false })

  // Format join date
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 py-12">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header with Cover Photo */}
        <div className="relative mb-20">
          {/* Cover Photo */}
          <div className="h-48 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-xl"></div>
          
          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <Avatar className="w-32 h-32 ring-4 ring-white/30 shadow-2xl">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-4xl">
                  {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link href="/profile/edit">
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 text-black rounded-full w-10 h-10 shadow-lg"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Edit Button for Desktop */}
          <div className="absolute top-4 right-4 hidden md:block">
            <Link href="/profile/edit">
              <Button className="bg-white/20 backdrop-blur-lg border-white/30 text-white hover:bg-white/30">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          {/* Name and Title */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {profile?.full_name || "Your Name"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-300">
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-pink-400" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-purple-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-400" />
                Joined {joinDate}
              </span>
            </div>
          </div>

          {/* Role Badge */}
          <div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-2 text-sm">
              {profile?.user_type === "freelancer" && "🎯 Freelancer"}
              {profile?.user_type === "client" && "💼 Client"}
              {profile?.user_type === "both" && "🔄 Hybrid (Freelancer + Client)"}
            </Badge>
          </div>

          {/* Bio Card */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border-2 border-blue-300/20">
            <CardContent className="p-6">
              <p className="text-white text-lg leading-relaxed">
                {profile?.bio || "No bio yet. Click the edit button to add one!"}
              </p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border-2 border-purple-300/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Experience</p>
                    <p className="text-xl font-bold text-white">
                      {profile?.experience_years ? `${profile.experience_years} years` : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(profile?.user_type === "freelancer" || profile?.user_type === "both") && (
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg border-2 border-green-300/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Hourly Rate</p>
                      <p className="text-xl font-bold text-white">
                        {profile?.hourly_rate ? `₹${profile.hourly_rate}/hr` : "Not set"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile?.company && (
              <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-lg border-2 border-orange-300/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Company</p>
                      <p className="text-xl font-bold text-white">{profile.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Skills Section */}
          {profile?.skills && profile.skills.length > 0 && (
            <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-lg border-2 border-pink-300/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-2 text-sm"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Section */}
          {portfolio && portfolio.length > 0 && (
            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-lg border-2 border-emerald-300/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-emerald-400" />
                  Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.map((item: any) => (
                    <a
                      key={item.id}
                      href={item.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-emerald-400/50 transition-all hover:bg-white/10">
                        <h3 className="text-white font-medium group-hover:text-emerald-400">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">{item.live_url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}