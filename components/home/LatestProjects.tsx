import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { IndianRupee } from "lucide-react"

export default async function LatestProjects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      profiles!projects_client_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(6)

  if (!projects || projects.length === 0) {
    return null
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#D4A5A5] to-[#A7C7E7]">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Latest <span className="text-[#FFD700]">Projects</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full bg-white/30 backdrop-blur-sm border-white/20 hover:border-[#FFD700] transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold line-clamp-1">
                      {project.title}
                    </CardTitle>
                    {project.is_verified && (
                      <Badge className="bg-[#FFD700] text-black">✓ Verified</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="capitalize">{project.category || "General"}</span>
                    <span>•</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.skills_required.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="outline" className="bg-white/50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-lg font-bold text-[#FFD700]">
                    <IndianRupee className="w-5 h-5" />
                    {project.budget?.toLocaleString() || "Negotiable"}
                  </div>
                </CardContent>

                <CardFooter className="border-t border-white/20 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold">
                      {project.profiles?.full_name?.[0] || "C"}
                    </div>
                    <span className="text-sm text-gray-700">
                      {project.profiles?.full_name || "Client"}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/projects"
            className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 font-semibold"
          >
            Browse All Projects →
          </Link>
        </div>
      </div>
    </section>
  )
}