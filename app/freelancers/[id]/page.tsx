import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import PortfolioItem from '@/components/freelancers/PortfolioItem'

export default async function FreelancerProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: freelancer } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!freelancer) notFound()

  const { data: portfolio } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('freelancer_id', params.id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={freelancer.avatar_url || ''} />
          <AvatarFallback>{freelancer.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{freelancer.full_name}</h1>
          <p className="text-muted-foreground">@{freelancer.username}</p>
          {freelancer.is_verified && <Badge className="mt-2">Verified Freelancer</Badge>}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Bio</h2>
        <p>{freelancer.bio || 'No bio yet.'}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <div className="flex gap-2 flex-wrap">
          {freelancer.skills?.map(skill => (
            <Badge key={skill} variant="secondary">{skill}</Badge>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
        {portfolio?.length === 0 ? (
          <p>No portfolio items yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {portfolio?.map(item => (
              <PortfolioItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}