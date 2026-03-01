import { createClient } from "@/lib/supabase/server"
import ProjectCard from "@/components/projects/ProjectCard"
import ProjectFilters from "@/components/projects/ProjectFilters"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: {
    category?: string
    minBudget?: string
    maxBudget?: string
  }
}) {
  const supabase = await createClient()

  let query = supabase
    .from("projects")
    .select("*, profiles!projects_client_id_fkey(username, full_name)")
    .eq("status", "open")

  // Safe filters
  if (searchParams?.category) {
    query = query.eq("category", searchParams.category)
  }

  if (searchParams?.minBudget) {
    const min = parseInt(searchParams.minBudget)
    if (!isNaN(min)) {
      query = query.gte("budget", min)
    }
  }

  if (searchParams?.maxBudget) {
    const max = parseInt(searchParams.maxBudget)
    if (!isNaN(max)) {
      query = query.lte("budget", max)
    }
  }

  const { data: projects, error } = await query.order("created_at", {
    ascending: false,
  })

  if (error) {
    console.error("Projects fetch error:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Projects</h1>

      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <ProjectFilters />
        </aside>

        <div className="md:col-span-3 space-y-4">
          {!projects || projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}