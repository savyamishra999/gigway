import { createClient } from '@/lib/supabase/server'
import { optimizeImage, readImageBody } from '@/lib/media/image-server'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  const db = await createClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })
  const type = request.headers.get('content-type') || ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return new Response('Unsupported image', { status: 415 })
  try {
    const bytes = await readImageBody(request, 4 * 1024 * 1024)
    const asset = await optimizeImage(bytes, type)
    if (asset.bytes === bytes) return new Response(null, { status: 204 })
    return new Response(new Uint8Array(asset.bytes), { headers: { 'Content-Type': asset.type, 'Cache-Control': 'no-store' } })
  } catch { return new Response('Could not optimize image', { status: 422 }) }
}
