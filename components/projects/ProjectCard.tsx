import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  title: string
  description: string
  budget: number
  category: string
  skills_required: string[]
  status: string
  is_verified: boolean
  profiles: {
    username: string
    full_name: string
  }
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex justify-between items-start gap-2">
          <Link href={`/projects/${project.id}`} className="hover:underline text-lg">
            {project.title}
          </Link>
          {project.is_verified && (
            <Badge variant="default" className="bg-green-600">✅ Verified</Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          by {project.profiles?.full_name || project.profiles?.username}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm mb-3">{project.description}</p>
        <div className="flex gap-1 flex-wrap">
          {project.skills_required?.slice(0, 4).map((skill: string) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {project.skills_required?.length > 4 && (
            <Badge variant="outline" className="text-xs">+{project.skills_required.length - 4}</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="font-bold text-primary">₹{project.budget?.toLocaleString()}</span>
        <Badge variant="secondary" className="capitalize">
          {project.status}
        </Badge>
      </CardFooter>
    </Card>
  )
}