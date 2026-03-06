import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, DollarSign, LinkIcon, Mail, Calendar, Edit } from "lucide-react"

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header with Cover Photo */}
        <div className="relative mb-20">
          {/* Cover Photo - Gray */}
          <div className="h-48 rounded-2xl bg-gray-200 shadow-sm"></div>
          
          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <Avatar className="w-32 h-32 ring-4 ring-white shadow-2xl">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-gray-300 text-gray-700 text-4xl">
                  {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link href="/profile/edit">
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 bg-gray-800 hover:bg-gray-900 text-white rounded-full w-10 h-10 shadow-lg"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Edit Button for Desktop */}
          <div className="absolute top-4 right-4 hidden md:block">
            <Link href="/profile/edit">
              <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          {/* Name and Title */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {profile?.full_name || "Your Name"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-gray-500" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                Joined {joinDate}
              </span>
            </div>
          </div>

          {/* Role Badge */}
          <div>
            <Badge className="bg-gray-800 text-white border-0 px-4 py-2 text-sm">
              {profile?.user_type === "freelancer" && "Freelancer"}
              {profile?.user_type === "client" && "Client"}
              {profile?.user_type === "both" && "Hybrid (Freelancer + Client)"}
            </Badge>
          </div>

          {/* Bio Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                {profile?.bio || "No bio yet. Click the edit button to add one!"}
              </p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Briefcase className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="text-xl font-bold text-gray-900">
                      {profile?.experience_years ? `${profile.experience_years} years` : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(profile?.user_type === "freelancer" || profile?.user_type === "both") && (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hourly Rate</p>
                      <p className="text-xl font-bold text-gray-900">
                        {profile?.hourly_rate ? `₹${profile.hourly_rate}/hr` : "Not set"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile?.company && (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Briefcase className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-xl font-bold text-gray-900">{profile.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Skills Section */}
          {profile?.skills && profile.skills.length > 0 && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2 text-lg">
                  <span className="text-gray-600">⚡</span> Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="bg-gray-100 text-gray-800 border-0 px-4 py-2 text-sm font-normal"
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
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2 text-lg">
                  <LinkIcon className="h-5 w-5 text-gray-600" />
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
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-400 transition-all hover:bg-gray-100">
                        <h3 className="text-gray-900 font-medium group-hover:text-gray-700">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{item.live_url}</p>
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