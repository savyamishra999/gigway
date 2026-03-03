import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileHeaderProps {
  profile: {
    full_name: string | null
    avatar_url: string | null
  }
  userEmail?: string
}

export default function ProfileHeader({ profile, userEmail }: ProfileHeaderProps) {
  const initials = profile.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : userEmail?.[0].toUpperCase() || "U"

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={profile.avatar_url || ""} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-2xl font-semibold">{profile.full_name || "Your Name"}</h2>
        <p className="text-gray-600">{userEmail}</p>
      </div>
    </div>
  )
}