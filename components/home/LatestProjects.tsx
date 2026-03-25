import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const CATEGORY_LABELS: Record<string, string> = {
  "web-dev": "Web Dev",
  "design": "Design",
  "mobile": "Mobile",
  "writing": "Writing",
  "marketing": "Marketing",
  "video": "Video",
  "data": "Data",
  "other": "Other",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function LatestProjects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, budget, category, created_at, skills_required, client_id, profiles:client_id(full_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(6)

  if (!projects || projects.length === 0) return null

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-[#111111] to-[#0A0A0A]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[#FFD700] text-sm font-semibold uppercase tracking-widest mb-2">Fresh Opportunities</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Latest <span className="text-[#FFD700]">Projects</span>
            </h2>
          </div>
          <Link
            href="/projects"
            className="hidden md:inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 text-sm font-semibold transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#FFD700]/40 hover:bg-white/8 transition-all h-full flex flex-col group">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#FFD700] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">{project.description}</p>

                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(project.skills_required as string[]).slice(0, 3).map((skill: string) => (
                        <Badge
                          key={skill}
                          className="bg-white/5 text-gray-400 border-white/10 text-xs px-2 py-0.5"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#FFD700] font-bold text-lg">
                      ₹{project.budget?.toLocaleString() || "Negotiable"}
                    </span>
                    <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">
                      {CATEGORY_LABELS[project.category] || project.category || "General"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(project.created_at)}
                    </span>
                    <span>{(project.profiles as { full_name?: string } | null)?.full_name || "Client"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link href="/projects" className="text-[#FFD700] font-semibold text-sm hover:underline">
            Browse All Projects →
          </Link>
        </div>
      </div>
    </section>
  )
}
