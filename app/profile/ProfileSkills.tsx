import { Badge } from "@/components/ui/badge"

interface ProfileSkillsProps {
  skills: string[]
}

export default function ProfileSkills({ skills }: ProfileSkillsProps) {
  if (!skills || skills.length === 0) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <Badge
            key={skill}
            className="bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-3 py-1 text-sm font-medium"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  )
}
