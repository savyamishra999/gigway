import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles!projects_client_id_fkey(*)')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  // Dummy freelancer ID for apply (Phase 1)
  const DUMMY_FREELANCER_ID = '22222222-2222-2222-2222-222222222222'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        {project.is_verified && <Badge size="lg">✅ Verified Project</Badge>}
      </div>
      
      <div className="flex gap-2 mb-4">
        {project.skills_required?.map(skill => (
          <Badge key={skill} variant="secondary">{skill}</Badge>
        ))}
      </div>

      <div className="prose dark:prose-invert mb-8">
        <p>{project.description}</p>
      </div>

      <div className="border rounded-lg p-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-2xl font-bold">₹{project.budget}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Posted by</p>
            <p>{project.profiles?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p>{project.category}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline">{project.status}</Badge>
          </div>
        </div>
      </div>

      {/* Apply button – uses dummy freelancer ID */}
      <form action="/api/proposals" method="POST">
        <input type="hidden" name="project_id" value={project.id} />
        <input type="hidden" name="freelancer_id" value={DUMMY_FREELANCER_ID} />
        <Button type="submit" size="lg" className="w-full">
          Apply Now (Demo – Dummy Freelancer)
        </Button>
      </form>
    </div>
  )
}