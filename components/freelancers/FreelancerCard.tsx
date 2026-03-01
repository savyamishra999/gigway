import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface FreelancerCardProps {
  freelancer: {
    id: string
    full_name: string
    avatar_url?: string
    bio?: string
    hourly_rate?: number
    skills?: string[]
    is_verified?: boolean
  }
}

export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  return (
    <Link href={`/freelancers/${freelancer.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition">
        <div className="flex items-center gap-3 mb-2">
          <Avatar>
            <AvatarImage src={freelancer.avatar_url || ""} />
            <AvatarFallback>{freelancer.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{freelancer.full_name}</h3>
            {freelancer.is_verified && (
              <Badge variant="secondary">Verified</Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{freelancer.bio}</p>
        <div className="mt-2">
          {freelancer.skills?.slice(0, 3).map(skill => (
            <Badge key={skill} variant="outline" className="mr-1">
              {skill}
            </Badge>
          ))}
        </div>
        <p className="mt-2 font-semibold">₹{freelancer.hourly_rate}/hr</p>
      </div>
    </Link>
  )
}