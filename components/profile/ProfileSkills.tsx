import { Badge } from "@/components/ui/badge"

export default function ProfileSkills({ skills }: { skills: string[] }) {
  if (!skills || skills.length === 0) {
    return <p className="text-gray-500">No skills added yet.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <Badge key={skill} variant="secondary">
          {skill}
        </Badge>
      ))}
    </div>
  )
}