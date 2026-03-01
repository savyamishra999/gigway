import { createClient } from '@/lib/supabase/server'
import FreelancerCard from '@/components/freelancers/FreelancerCard'

export default async function FreelancersPage() {
  const supabase = await createClient()
  const { data: freelancers } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'freelancer')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Find Freelancers</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {freelancers?.map(f => (
          <FreelancerCard key={f.id} freelancer={f} />
        ))}
      </div>
    </div>
  )
}