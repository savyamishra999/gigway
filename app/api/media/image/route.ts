import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { imageVariantUrl, PUBLIC_IMAGE_CACHE_SECONDS } from '@/lib/media/image-policy'
import { cachedImage, optimizeImage, readImageBody } from '@/lib/media/image-server'

export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src') || ''
  const width = Number(request.nextUrl.searchParams.get('w'))
  if (!imageVariantUrl(src, width) || !src.startsWith('https://')) return new Response('Invalid image', { status: 400 })
  try {
    const asset = await cachedImage(`variant:${src}:${width}`, async () => {
      const source = await cachedImage(`source:${src}`, async () => {
        const response = await fetch(src, { redirect: 'error', signal: AbortSignal.timeout(15_000), cache: 'no-store' })
        if (!response.ok) throw new Error('Image unavailable')
        const type = response.headers.get('content-type')?.split(';')[0] || ''
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('Unsupported image')
        return { bytes: await readImageBody(response), type }
      })
      return optimizeImage(source.bytes, source.type, width, true)
    })
    const etag = `"${createHash('sha256').update(asset.bytes).digest('hex')}"`
    const headers = { 'Content-Type': asset.type, 'Cache-Control': `public, max-age=${PUBLIC_IMAGE_CACHE_SECONDS}, s-maxage=${PUBLIC_IMAGE_CACHE_SECONDS}`, ETag: etag, 'X-Content-Type-Options': 'nosniff' }
    if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers })
    return new Response(new Uint8Array(asset.bytes), { headers })
  } catch { return new Response('Image unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } }) }
}
