// Fixed variants keep cache keys bounded. Originals remain available for zoom/export.
export const IMAGE_WIDTHS = [96, 192, 384, 768, 1280, 1920, 2560] as const
export const PUBLIC_IMAGE_CACHE_SECONDS = 86400

export function imageVariantUrl(src: string, width: number): string | null {
  if (!IMAGE_WIDTHS.includes(width as typeof IMAGE_WIDTHS[number])) return null
  if (/^\/social\/posts\/[^/?]+\/media\/[^/?]+\/public$/.test(src)) return `${src}?w=${width}`
  if (/^\/api\/social\/posts\/[^/?]+\/media\/[^/?]+\/file$/.test(src)) return `${src}?w=${width}`
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  try {
    const url = new URL(src)
    if (decodeURIComponent(url.pathname).split('/').some(part => part === '..' || part === '.' || part.includes('\\'))) return null
    if (url.origin !== new URL(base).origin || url.username || url.password || url.search || url.hash || !url.pathname.startsWith('/storage/v1/object/public/avatars/')) return null
    return `/api/media/image?src=${encodeURIComponent(src)}&w=${width}`
  } catch { return null }
}
