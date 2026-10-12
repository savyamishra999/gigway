import sharp from 'sharp'

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024
type Asset = { bytes: Buffer; type: string }
const entries = new Map<string, { value: Asset; expires: number }>()
const pending = new Map<string, Promise<Asset>>()
let cacheBytes = 0
const MAX_CACHE_BYTES = 48 * 1024 * 1024
let activeTransforms = 0

// Per-process LRU + in-flight coalescing. Authorization must happen BEFORE use.
export async function cachedImage(key: string, load: () => Promise<Asset>): Promise<Asset> {
  const found = entries.get(key)
  if (found) {
    entries.delete(key)
    if (found.expires > Date.now()) { entries.set(key, found); return found.value }
    cacheBytes -= found.value.bytes.length
  }
  const active = pending.get(key)
  if (active) return active
  if (pending.size >= 16) throw new Error('Image processing busy')
  const task = load().then(value => {
    if (value.bytes.length <= MAX_IMAGE_BYTES) {
      while (entries.size && (cacheBytes + value.bytes.length > MAX_CACHE_BYTES || entries.size >= 256)) {
        const oldest = entries.keys().next().value!
        cacheBytes -= entries.get(oldest)!.value.bytes.length
        entries.delete(oldest)
      }
      entries.set(key, { value, expires: Date.now() + 300_000 })
      cacheBytes += value.bytes.length
    }
    return value
  }).finally(() => pending.delete(key))
  pending.set(key, task)
  return task
}

export async function readImageBody(response: Response | Request, maxBytes = MAX_IMAGE_BYTES) {
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Image too large')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Empty image')
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    for (;;) {
      const part = await reader.read()
      if (part.done) break
      length += part.value.length
      if (length > maxBytes) throw new Error('Image too large')
      chunks.push(part.value)
    }
  } catch (error) { await reader.cancel(); throw error }
  finally { reader.releaseLock() }
  if (!length) throw new Error('Empty image')
  return Buffer.concat(chunks)
}

export async function optimizeImage(bytes: Buffer, type: string, width?: number, squareDisplay = false): Promise<Asset> {
  const original = { bytes, type }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return original
  // Some decoders expose only the first APNG frame or discard JPEG gain maps.
  if ((type === 'image/png' && bytes.includes(Buffer.from('acTL'))) || bytes.includes(Buffer.from('hdrgm:'))) return original
  if (activeTransforms >= 2) throw new Error('Image processing busy')
  activeTransforms++
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'error' })
    const info = await image.metadata()
    // Preserve animation, high bit depth and non-sRGB colour rather than flatten them.
    if ((info.pages || 1) > 1 || info.depth !== 'uchar' || info.space !== 'srgb' || info.icc || info.xmp) return original
    const pipeline = image.rotate()
    if (width) pipeline.resize({ width, ...(squareDisplay ? { height: width, fit: 'outside' as const } : {}), withoutEnlargement: true })
    const output = await pipeline.webp({ lossless: true, effort: 4 }).timeout({ seconds: 10 }).toBuffer()
    return output.length < bytes.length ? { bytes: output, type: 'image/webp' } : original
  } finally { activeTransforms-- }
}
