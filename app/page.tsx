import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ProjectCard from '@/components/projects/ProjectCard'

export default async function Home() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles!projects_client_id_fkey(username, full_name)')
    .eq('status', 'open')
    .limit(6)

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold mb-4">India ka sabse bharosemand <span className="text-primary">freelance platform</span></h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Zero commission, verified projects, aur instant payments. Sirf Indian freelancers ke liye.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/projects">Find Work</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/projects/new">Post Project</Link>
          </Button>
        </div>
      </section>

      {/* Latest Projects */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Latest Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 py-12">
        <div className="text-center p-6 border rounded-lg">
          <h3 className="text-xl font-bold mb-2">Zero Commission</h3>
          <p className="text-muted-foreground">Freelancers ko 100% income – sirf clients pay karte hain subscription.</p>
        </div>
        <div className="text-center p-6 border rounded-lg">
          <h3 className="text-xl font-bold mb-2">Verified Projects</h3>
          <p className="text-muted-foreground">Har project ke saath proof – “Verified” badge builds trust.</p>
        </div>
        <div className="text-center p-6 border rounded-lg">
          <h3 className="text-xl font-bold mb-2">Live Portfolio</h3>
          <p className="text-muted-foreground">Apna kaam live dikhao – images, links, code snippets.</p>
        </div>
      </section>
    </div>
  )
}