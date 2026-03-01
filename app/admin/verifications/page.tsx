import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: pending } = await supabase
    .from('verification_docs')
    .select('*, projects(title), profiles(full_name)')
    .eq('status', 'pending')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Verifications</h1>
      <ul className="space-y-2">
        {pending?.map(item => (
          <li key={item.id} className="border p-4 rounded">
            <p>Project: {item.projects?.title}</p>
            <p>Freelancer: {item.profiles?.full_name}</p>
            <p>Documents: {item.document_urls?.length} files</p>
            <div className="flex gap-2 mt-2">
              <form action="/api/admin/verify" method="POST">
                <input type="hidden" name="verification_id" value={item.id} />
                <input type="hidden" name="action" value="approve" />
                <Button type="submit" size="sm">Approve</Button>
              </form>
              <form action="/api/admin/verify" method="POST">
                <input type="hidden" name="verification_id" value={item.id} />
                <input type="hidden" name="action" value="reject" />
                <Button type="submit" size="sm" variant="destructive">Reject</Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}