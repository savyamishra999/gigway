import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const project_id = formData.get('project_id')
  const freelancer_id = formData.get('freelancer_id')
  
  const supabase = await createClient()
  const { error } = await supabase.from('proposals').insert({
    project_id,
    freelancer_id,
    cover_letter: 'Demo proposal – will be replaced with real form later',
    bid_amount: 0,
    estimated_days: 7,
    status: 'pending'
  })

  if (error) {
    return NextResponse.redirect(new URL(`/projects/${project_id}?error=true`, request.url))
  }
  return NextResponse.redirect(new URL(`/projects/${project_id}?applied=true`, request.url))
}