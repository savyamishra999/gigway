import { ProfileAvatar } from "@/components/ui/profile-avatar"

interface ProfileHeaderProps {
  profile: {
    full_name: string | null
    avatar_url: string | null
  }
  userEmail?: string
}

export default function ProfileHeader({ profile, userEmail }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <ProfileAvatar src={profile.avatar_url} name={profile.full_name || userEmail} className="h-20 w-20 text-lg" />
      <div>
        <h2 className="text-2xl font-semibold">{profile.full_name || "Your Name"}</h2>
        <p className="text-gray-600">{userEmail}</p>
      </div>
    </div>
  )
}
